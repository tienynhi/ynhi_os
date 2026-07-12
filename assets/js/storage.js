/* ============================================================
   YNHI OS — STORAGE LAYER
   Wrapper thuần cho localStorage.
   File này KHÔNG được chứa business logic (tính tổng, đổi trạng
   thái, sinh mã đơn...). Chỉ đọc/ghi dữ liệu thô.
   ============================================================ */

var STORAGE_KEYS = {
  ORDERS: "ynhi_os_orders",
  DRAFT_ORDER: "ynhi_os_draft_order",
  SELECTED_ORDER_ID: "ynhi_os_selected_order_id"
};

/**
 * Đọc JSON an toàn từ localStorage, trả về fallback nếu lỗi/không có.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function safeReadJSON(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }
    var raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

/**
 * Ghi JSON an toàn vào localStorage.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} true nếu ghi thành công
 */
function safeWriteJSON(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}
/**
 * Đọc toàn bộ danh sách Order đã lưu.
 * @returns {object[]}
 */
function loadOrders() {
  return safeReadJSON(STORAGE_KEYS.ORDERS, []);
}

/**
 * Lưu toàn bộ danh sách Order.
 * @param {object[]} orders
 * @returns {boolean}
 */
function saveOrders(orders) {
  return safeWriteJSON(STORAGE_KEYS.ORDERS, orders || []);
}

/**
 * Đọc Draft Order hiện tại (đơn đang được CSKH nhập dở trên New Order).
 * @returns {object|null}
 */
function loadDraft() {
  return safeReadJSON(STORAGE_KEYS.DRAFT_ORDER, null);
}

/**
 * Lưu Draft Order hiện tại.
 * @param {object} draft
 * @returns {boolean}
 */
function saveDraft(draft) {
  return safeWriteJSON(STORAGE_KEYS.DRAFT_ORDER, draft);
}

/**
 * Xóa Draft Order hiện tại (sau khi đã tạo đơn thành công hoặc hủy tạo đơn).
 * @returns {boolean}
 */
function clearDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.DRAFT_ORDER);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Đọc ID của Order đang được chọn (dùng để mở đúng đơn trên Order Detail
 * khi điều hướng qua nhiều trang HTML riêng biệt).
 * @returns {string|null}
 */
function loadSelectedOrder() {
  return safeReadJSON(STORAGE_KEYS.SELECTED_ORDER_ID, null);
}

/**
 * Lưu ID của Order đang được chọn.
 * @param {string} orderId
 * @returns {boolean}
 */
function saveSelectedOrder(orderId) {
  return safeWriteJSON(STORAGE_KEYS.SELECTED_ORDER_ID, orderId);
}
