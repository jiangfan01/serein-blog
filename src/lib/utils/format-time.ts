/**
 * 相对时间格式化工具
 *
 * 将时间戳转换为人类可读的相对时间格式
 * 支持中文显示
 */

/**
 * 格式化相对时间
 *
 * @param date 日期对象或 ISO 字符串
 * @returns 相对时间字符串
 *
 * @example
 * formatRelativeTime(new Date()) // "刚刚"
 * formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000)) // "5 分钟前"
 * formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2 小时前"
 * formatRelativeTime(new Date(Date.now() - 24 * 60 * 60 * 1000)) // "昨天"
 * formatRelativeTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // "3 天前"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();

  // 未来时间
  if (diffMs < 0) {
    return "刚刚";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 1 分钟内
  if (diffMinutes < 1) {
    return "刚刚";
  }

  // 1 小时内
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  // 24 小时内
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  // 昨天
  if (diffDays === 1) {
    return "昨天";
  }

  // 7 天内
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  // 超过 7 天，显示具体日期
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const day = target.getDate();

  // 同一年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }

  // 不同年份，显示完整日期
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化为简短的相对时间（用于紧凑布局）
 *
 * @param date 日期对象或 ISO 字符串
 * @returns 简短的相对时间字符串
 *
 * @example
 * formatShortRelativeTime(new Date()) // "刚刚"
 * formatShortRelativeTime(new Date(Date.now() - 5 * 60 * 1000)) // "5分钟"
 * formatShortRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2小时"
 */
export function formatShortRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();

  if (diffMs < 0) {
    return "刚刚";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`;
  }

  if (diffHours < 24) {
    return `${diffHours}小时`;
  }

  if (diffDays === 1) {
    return "昨天";
  }

  if (diffDays < 7) {
    return `${diffDays}天`;
  }

  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}/${day}`;
}
