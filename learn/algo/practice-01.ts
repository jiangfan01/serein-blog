/**
 * 算法练习 01（你来写，我来审）
 *
 * 跑：pnpm exec tsx learn/algo/practice-01.ts
 * 规则：先默写模式模板，再动手；不许看 01/02 的答案；卡住超过 15 分钟再来问我思路。
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ 题 1 · 对撞双指针（LC 125 验证回文串）                    │
 * │ 题 2 · 快慢指针/链表（LC 19 删除链表的倒数第 N 个结点）   │
 * └─────────────────────────────────────────────────────────┘
 */

import { boolean } from "zod";

// ============================================================
// 题 1：验证回文串（对撞双指针）
// ============================================================
// 给一个字符串 s，只考虑字母和数字字符，忽略大小写，判断它是不是回文串。
//
// 示例：
//   "A man, a plan, a canal: Panama"  → true   （忽略标点空格大小写后是回文）
//   "race a car"                       → false
//   " "                                → true   （过滤后为空，算回文）
//
// 识别信号：判断回文 + 从两端往中间比 → 对撞双指针。
// 要点：左右指针，遇到非字母数字就跳过；比较时统一小写。
function isPalindrome(s: string): boolean {
  // TODO: 你来写
    let left = 0
    let right = s.length - 1
    while(left < right){
        if(!/[a-z0-9]/i.test(s[left])) {left ++;continue}
        if (!/[a-z0-9]/i.test(s[right])) { right --; continue; }

       if(s[left].toLowerCase() === s[right].toLowerCase()) {
         left ++;
         right --;
       }else{
        return false;
       }
    }
     return true;
}

// ============================================================
// 题 2：删除链表的倒数第 N 个结点（快慢指针）
// ============================================================
// 给链表头 head 和 n，删除倒数第 n 个结点，返回新的头。
//
// 示例：
//   [1,2,3,4,5], n=2  → [1,2,3,5]   （删掉倒数第 2 个 "4"）
//   [1], n=1          → []
//   [1,2], n=1        → [1]
//
// 识别信号：链表 + 倒数第 k 个 → 快慢指针（快的先走，拉开 n 的距离）。
// 要点：① 用虚拟头节点(dummy)解决"删的是头节点"的边界
//       ② fast 先走 n+1 步，再 fast/slow 一起走，slow 会停在"待删结点的前一个"
function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
    const dummy = new ListNode(0,head);
    let fast:ListNode | null = dummy
    let slow:ListNode | null = dummy
for (let i = 0; i <= n; i++) {
    fast =  fast!.next
}

while( fast !== null){
   slow = slow!.next
   fast = fast!.next
}
    slow!.next!.next


    return dummy.next
}

// ============================================================
// 下面是测试 + 工具，别动，写完上面两个函数直接跑
// ============================================================
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val ?? 0;
    this.next = next ?? null;
  }
}
function arrayToList(arr: number[]): ListNode | null {
  const dummy = new ListNode();
  let cur = dummy;
  for (const v of arr) {
    cur.next = new ListNode(v);
    cur = cur.next;
  }
  return dummy.next;
}
function listToArray(head: ListNode | null): number[] {
  const out: number[] = [];
  while (head) {
    out.push(head.val);
    head = head.next;
  }
  return out;
}
function check(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  console.log(`${g === w ? "✅" : "❌"} ${name}  得到 ${g}  期望 ${w}`);
}

function run() {
  console.log("=== 题 1：验证回文串 ===");
  check("回文", isPalindrome("A man, a plan, a canal: Panama"), true);
  check("非回文", isPalindrome("race a car"), false);
  check("空白", isPalindrome(" "), true);
  check("单字符", isPalindrome("a"), true);

  console.log("\n=== 题 2：删除倒数第 N 个 ===");
  check("中间", listToArray(removeNthFromEnd(arrayToList([1, 2, 3, 4, 5]), 2)), [1, 2, 3, 5]);
  check("删头", listToArray(removeNthFromEnd(arrayToList([1]), 1)), []);
  check("两节点删头", listToArray(removeNthFromEnd(arrayToList([1, 2]), 1)), [1]);
  check("删第一个", listToArray(removeNthFromEnd(arrayToList([1, 2, 3]), 3)), [2, 3]);
}

run();
