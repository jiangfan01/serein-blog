/**
 * 算法模式 02 · 快慢指针（双指针的"链表流派"）
 *
 * 运行：pnpm exec tsx src/lib/agent/learn/algo/02-fast-slow-pointers.ts
 *
 * 破除误区：双指针不是数组专用！快慢指针是链表题的核心武器。
 * 你已经会双指针了，这一课只是把它"迁移"到链表 —— 非数组破冰。
 */

// ============================================================
// 链表节点（非数组结构的第一课）
// ============================================================
class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

// 把数组建成链表，方便测试
function build(arr: number[]): ListNode | null {
  const dummy = new ListNode(0); // 虚拟头节点：链表题的万能边界处理器
  let cur = dummy;
  for (const v of arr) {
    cur.next = new ListNode(v);
    cur = cur.next;
  }
  return dummy.next;
}

// ============================================================
// 怎么"认出"该用快慢指针？（识别信号）
// ============================================================
//   1. 链表 + "找中点 / 找环 / 倒数第 k 个" → 快慢指针
//   2. "原地"操作数组、移动元素 → 快慢指针（同向）
//   3. 你想"一次遍历搞定，不想先求长度再遍历第二次" → 快慢指针
//
// 核心思想：两个指针同向走，但速度/起点不同，用"速度差/距离差"换信息。

// ============================================================
// 应用 A：找链表中点（fast 走 2 步，slow 走 1 步）
// ============================================================
// fast 到终点时，slow 正好在中点。因为 fast 走的路是 slow 的两倍。
function middleNode(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next; // 慢的走 1 步
    fast = fast.next.next; // 快的走 2 步
  }
  return slow; // 偶数个节点时，返回偏右的中点
}

// ============================================================
// 应用 B：判断链表有没有环（Floyd 判圈，经典"想不到"）
// ============================================================
// 如果有环，快指针迟早会从后面"追上"慢指针（像操场上套圈）。
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true; // 相遇 = 有环
  }
  return false; // fast 走到 null = 无环
}

// ============================================================
// 应用 C：找倒数第 k 个节点（快指针先走 k 步，再一起走）
// ============================================================
// 两指针保持 k 的距离，快的到终点时，慢的正好在倒数第 k 个。
function nthFromEnd(head: ListNode | null, k: number): ListNode | null {
  let fast = head;
  for (let i = 0; i < k; i++) {
    if (!fast) return null;
    fast = fast.next;
  }
  let slow = head;
  while (fast) {
    slow = slow!.next;
    fast = fast.next;
  }
  return slow;
}

// ============================================================
// 自测
// ============================================================
const list = build([1, 2, 3, 4, 5]);
console.log("中点（[1,2,3,4,5] 期望 3）:", middleNode(list)?.val);
console.log("倒数第 2 个（期望 4）:", nthFromEnd(list, 2)?.val);
console.log("有环？（期望 false）:", hasCycle(list));

// 手动造个环测 hasCycle：5 -> 指回 2
const cyc = build([1, 2, 3, 4, 5])!;
let tail = cyc;
while (tail.next) tail = tail.next;
tail.next = cyc.next; // 尾巴指回第二个节点，形成环
console.log("有环？（期望 true）:", hasCycle(cyc));

// ============================================================
// 你的练习题单（链表破冰，按顺序做）
// ============================================================
// 1. LeetCode 876 链表的中间结点（上面，先默写）
// 2. LeetCode 141 环形链表（hasCycle）
// 3. LeetCode 19  删除链表的倒数第 N 个结点（nthFromEnd + dummy）
// 4. LeetCode 206 反转链表（链表另一大基本功：改指向）
// 5. LeetCode 21  合并两个有序链表（dummy + 双指针）
