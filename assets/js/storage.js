/* ============================================================
   YNHI OS — STORAGE LAYER
   Wrapper thuần cho localStorage.
   File này KHÔNG được chứa business logic (tính tổng, đổi trạng
   thái, sinh mã đơn...). Chỉ đọc/ghi dữ liệu thô.
   ------------------------------------------------------------
   NÂNG CẤP: Draft giờ là DANH SÁCH (drafts[]) thay vì 1 object
   duy nhất, để hỗ trợ CSKH tạo nhiều Draft cùng lúc (Draft A,
   Draft B, Draft C...). Mỗi Draft vẫn dùng đúng Order Model hiện
   có, chỉ khác là được lưu trong 1 mảng thay vì 1 key đơn.
   ============================================================ */

var STORAGE_KEYS = {
  ORDERS: "ynhi_os_orders",
  DRAFTS: "ynhi_os_drafts",
  ACTIVE_DRAFT_ID: "ynhi_os_active_draft_id",
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
 * Đọc toàn bộ danh sách Draft đang lưu (nhiều Draft cùng lúc).
 * @returns {object[]}
 */
function loadDrafts() {
  return safeReadJSON(STORAGE_KEYS.DRAFTS, []);
}

/**
 * Lưu toàn bộ danh sách Draft.
 * @param {object[]} drafts
 * @returns {boolean}
 */
function saveDrafts(drafts) {
  return safeWriteJSON(STORAGE_KEYS.DRAFTS, drafts || []);
}

/**
 * Đọc id của Draft đang được chỉnh sửa (Draft đang mở trên New Order).
 * @returns {string|null}
 */
function loadActiveDraftId() {
  return safeReadJSON(STORAGE_KEYS.ACTIVE_DRAFT_ID, null);
}

/**
 * Lưu id của Draft đang được chỉnh sửa.
 * @param {string|null} draftId
 * @returns {boolean}
 */
function saveActiveDraftId(draftId) {
  return safeWriteJSON(STORAGE_KEYS.ACTIVE_DRAFT_ID, draftId);
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
