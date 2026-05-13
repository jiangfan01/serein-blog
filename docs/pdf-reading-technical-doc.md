# PDF 点读功能技术文档

## 功能概述

实现了一个面向教育场景的 PDF 点读阅读器，用户可以在小程序 WebView 中打开 PDF 课本，点击任意句子即可听到 AI 语音朗读。核心技术点包括：PDF 文字精准定位、大文件加载优化、流式 TTS 实时合成播放。

---

## 一、PDF.js 文字精准定位

### 问题

PDF 是一种"所见即所得"的排版格式，文字位置信息以绝对坐标存储。要实现"点哪读哪"，需要知道每个句子在页面上的精确位置。

### 方案：后端解析 + 百分比 bbox

**后端（MinerU 解析）**：

上传 PDF 后，后端调用 MinerU（PDF 智能解析服务）提取每个文本块的坐标信息，返回格式：

```json
{
  "id": "sentence_001",
  "text": "金黄的梅子，飞舞的蝴蝶...",
  "page_no": 3,
  "bbox": [12.5, 8.3, 88.2, 15.6]
}
```

`bbox` 是百分比格式 `[left%, top%, right%, bottom%]`，相对于页面宽高的比例值。用百分比而不是像素的好处是：**不管前端渲染的分辨率是多少，定位都是准确的**。

**前端（覆盖层定位）**：

```tsx
// bbox 覆盖层和 PDF 页面同尺寸、同位置
<div className="novel-hit-overlay" style={{ width: bookSize.width, height: bookSize.height }}>
  {sentences.map((s) => {
    const [left, top, right, bottom] = s.bbox;
    return (
      <div
        className="novel-sentence"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${right - left}%`,
          height: `${bottom - top}%`,
        }}
        onClick={() => playSentence(s)}
      />
    );
  })}
</div>
```

关键设计：
- 覆盖层设置 `pointer-events: none`，只有 bbox 元素设置 `pointer-events: auto`
- 这样滑动手势穿透到下层的翻书组件，点击 bbox 区域触发点读
- 翻页和点读互不干扰

### 翻书效果

使用 `react-pageflip` 实现真实翻书动效，`usePortrait={true}` 强制单页模式适配手机端。

---

## 二、PDF 大文件加载优化

### 问题

教材 PDF 通常 50-150MB，如果等整个文件下载完才渲染，首屏需要 30s+。

### 方案：HTTP Range 请求 + 按需加载

**原理**：

PDF 文件结构的特点是——文件末尾存储了一个 xref 交叉引用表（目录索引），记录了每一页数据在文件中的字节偏移量。pdf.js 利用这个特性：

1. 先请求文件末尾的几十 KB（获取 xref 表）
2. 解析出第 1 页的数据位于文件的第 X 到第 Y 字节
3. 只请求那几百 KB 的数据 → 渲染第 1 页
4. 翻到第 N 页时，再请求第 N 页对应的字节范围

```
GET /oss/book.pdf
Range: bytes=117440512-117506048    ← 只请求末尾 64KB（xref 表）

GET /oss/book.pdf
Range: bytes=2048000-2097152        ← 只请求第 1 页的数据
```

**前端配置**：

```typescript
const pdf = await pdfjsLib.getDocument({
  url,
  disableAutoFetch: true,   // 不自动预取整个文件
  disableStream: false,     // 启用流式传输
  rangeChunkSize: 65536,    // 每次 Range 请求 64KB
}).promise;
```

**Nginx 配置**（关键）：

```nginx
location /oss/ {
    proxy_pass https://jilan.oss-cn-hangzhou.aliyuncs.com/;
    
    # 透传 Range 请求头（让 pdf.js 按需加载生效）
    proxy_set_header Range $http_range;
    proxy_set_header If-Range $http_if_range;
    proxy_pass_header Content-Range;
    proxy_pass_header Accept-Ranges;
}
```

**效果**：

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首屏加载（112MB PDF） | 30s+ | 2-3s |
| 实际下载量（首屏） | 112MB | ~200KB |
| 第二次打开 | 30s+ | <1s（浏览器缓存） |

### 为什么需要 Nginx 代理

PDF 文件存储在阿里云 OSS，前端页面在 `test.jilan.tech`，直接请求 OSS 会跨域。通过 Nginx 反向代理 `/oss/` 路径到 OSS，同时透传 Range 头，解决跨域的同时保留按需加载能力。

---

## 三、流式 TTS 实时合成播放

### 问题

传统 TTS 流程：前端请求 → 后端调阿里云合成完整音频 → 写文件 → 返回。一句话需要等 500ms-1s 才能开始播放。

### 方案：流式合成 + Web Audio API

**整体架构**：

```
用户点击句子
  → fetch('/api/v1/reading/sentences/{id}/audio/stream')
  → 后端通过 WebSocket 连接阿里云 CosyVoice
  → 阿里云边合成边推 MP3 chunk
  → 后端 StreamingResponse 边收边推给前端
  → 前端收完后 AudioContext.decodeAudioData 解码播放
```

**后端实现**：

```python
# cosyvoice_client.py
async def synthesize_stream(self, text, voice, model, speed):
    queue: asyncio.Queue[bytes | None] = asyncio.Queue()

    class StreamCallback(ResultCallback):
        def on_data(self, data: bytes) -> None:
            queue.put_nowait(data)       # 收到 chunk 立即入队
        def on_complete(self) -> None:
            queue.put_nowait(None)        # 结束信号

    callback = StreamCallback()
    synthesizer = SpeechSynthesizer(model=model, voice=voice, callback=callback)
    
    # call() 有 callback 时是非阻塞的
    loop.run_in_executor(None, synthesizer.call, text)

    # 从 queue 逐个 yield chunk
    while True:
        chunk = await queue.get()
        if chunk is None:
            break
        yield chunk
```

```python
# reading.py - 流式接口
@router.get("/sentences/{sentence_id}/audio/stream")
async def stream_reading_sentence_audio(sentence_id, query, db):
    audio_stream = await reading_service.get_sentence_audio_stream(db, sentence_id, ...)
    return StreamingResponse(audio_stream, media_type="audio/mpeg")
```

**前端实现**：

```typescript
const playSentence = async (sentence) => {
  // 初始化 AudioContext（需要用户手势触发）
  const ctx = new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  // 请求流式接口
  const response = await fetch(`/tts/api/v1/reading/sentences/${sentence.id}/audio/stream`);
  const arrayBuffer = await response.arrayBuffer();

  // 解码 MP3 → PCM AudioBuffer
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  // 播放
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = playbackSpeed;
  source.connect(ctx.destination);
  source.start();
};
```

**缓存策略**：

后端有两层缓存：
1. 首次请求：流式合成并返回
2. 合成完成后：音频文件写入本地磁盘缓存
3. 再次请求同一句子：直接流式读取缓存文件（几十毫秒级响应）

**回退机制**：

如果 Web Audio API 不可用（极端情况），自动回退到 `<audio>` 标签 + 非流式接口：

```typescript
catch (err) {
  // 回退到 <audio> 标签
  audio.src = buildReadingSentenceAudioUrl(sentence.id);
  audio.play();
}
```

---

## 四、技术栈总结

| 层 | 技术 | 用途 |
|---|---|---|
| PDF 渲染 | pdf.js (CDN) | 解析渲染 PDF 页面 |
| 翻书动效 | react-pageflip | 真实翻书体验 |
| 文字定位 | MinerU + 百分比 bbox | 精准点读热区 |
| 大文件加载 | HTTP Range + Nginx 代理 | 按需加载，秒开 |
| 语音合成 | 阿里云 CosyVoice (WebSocket) | 流式 TTS |
| 音频播放 | Web Audio API | 低延迟解码播放 |
| 后端框架 | FastAPI + StreamingResponse | 流式推送 |
| 运行环境 | 微信小程序 WebView | iOS/Android 兼容 |

---

## 五、性能指标

| 指标 | 数值 |
|------|------|
| PDF 首屏加载（112MB） | 2-3s |
| PDF 二次加载 | <1s |
| TTS 首次合成延迟 | 300-500ms |
| TTS 缓存命中延迟 | <100ms |
| 翻页动画帧率 | 60fps |

---

## 六、关键设计决策

1. **bbox 用百分比而非像素**：适配任意分辨率，不需要根据渲染尺寸重新计算坐标

2. **覆盖层独立于翻书组件**：react-pageflip 内部会拦截触摸事件，把 bbox 层提到外面用 `pointer-events` 控制穿透

3. **Range 请求而非分页图片**：保留 PDF 原始矢量质量，不需要后端预处理

4. **流式合成而非预合成**：不需要提前合成整本书的音频，按需合成 + 缓存，节省计算资源

5. **Web Audio API 而非 `<audio>` 标签**：更精确的播放控制，支持 playbackRate 调节，不受浏览器自动播放策略限制（在用户手势触发后）
