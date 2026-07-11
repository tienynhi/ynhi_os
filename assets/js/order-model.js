/* ============================================================
   YNHI OS — ORDER MODEL
   Tầng định nghĩa cấu trúc dữ liệu Order (Business Data).
   File này KHÔNG được chứa bất kỳ thao tác DOM hay UI nào.
   Không querySelector, không innerHTML, không addEventListener.
   ============================================================ */

/**
 * Trạng thái hợp lệ của một Order trong toàn bộ workflow.
 * Khớp với 6 màn Order Status hiện có của Ynhi OS.
 */
var ORDER_STATUS = {
  WAITING_CONFIRM: "waiting_confirm",   // Chờ xác nhận
  IN_PROGRESS: "in_progress",           // Đang làm
  WAITING_DELIVERY: "waiting_delivery", // Chờ giao
  DELIVERING: "delivering",             // Đang giao
  DELIVERED: "delivered",               // Giao thành công
  COMPLETED: "completed"                // Hoàn thành
};

/**
 * Sinh ID nội bộ duy nhất cho một Order.
 * Không phụ thuộc thư viện ngoài, không cần UUID chuẩn RFC.
 * @returns {string}
 */
function generateOrderId() {
  var timePart = Date.now().toString(36);
  var randomPart = Math.random().toString(36).slice(2, 10);
  return "ord_" + timePart + "_" + randomPart;
}

/**
 * Sinh mã đơn hiển thị cho khách/CSKH, dạng #DH00001, #DH00002...
 * @param {number} sequenceNumber - số thứ tự đơn (bắt đầu từ 1)
 * @returns {string}
 */
function generateOrderCode(sequenceNumber) {
  var safeNumber = typeof sequenceNumber === "number" && sequenceNumber > 0
    ? sequenceNumber
    : 1;
  var padded = String(safeNumber).padStart(5, "0");
  return "#DH" + padded;
}

/**
 * Tạo một Draft Order rỗng - dùng khi CSKH bắt đầu tạo đơn mới
 * trên màn New Order. Đây chỉ là dữ liệu tạm, chưa phải Order thật.
 * @returns {object}
 */
function createEmptyDraftOrder() {
  return {
    customer: {
      name: "",
      phone: "",
      address: "",
      customerType: "",
      source: ""
    },
    products: [],
    delivery: {
      date: "",
      time: "",
      isInstant: false,
      shipUnit: "",
      shipFee: 0
    },
    payment: {
      method: "",
      depositAmount: 0
    },
    notes: {
      customerNote: "",
      kitchenNote: ""
    },
    summary: {
      subtotal: 0,
      shipFee: 0,
      discount: 0,
      total: 0,
      deposit: 0,
      amountDue: 0
    }
  };
}

/**
 * Tính lại các số tổng trong summary dựa trên products/ship/discount hiện có.
 * Hàm thuần dữ liệu, không đụng UI.
 * @param {object} draft
 * @returns {object} summary đã tính lại
 */
function recalculateSummary(draft) {
  var products = (draft && draft.products) || [];
  var subtotal = products.reduce(function (sum, item) {
    var price = Number(item.price) || 0;
    var quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  var shipFee = (draft && draft.delivery && Number(draft.delivery.shipFee)) || 0;
  var discount = (draft && draft.summary && Number(draft.summary.discount)) || 0;
  var deposit = (draft && draft.payment && Number(draft.payment.depositAmount)) || 0;

  var total = subtotal + shipFee - discount;
  var amountDue = total - deposit;

  return {
    subtotal: subtotal,
    shipFee: shipFee,
    discount: discount,
    total: total,
    deposit: deposit,
    amountDue: amountDue
  };
}

/**
 * Chuyển một Draft Order thành một Order thật (chính thức tồn tại trong hệ thống).
 * Đây là điểm DUY NHẤT một Order được sinh ra.
 * @param {object} draft - draftOrder hiện tại
 * @param {number} sequenceNumber - số thứ tự để sinh mã đơn
 * @returns {object} Order hoàn chỉnh
 */
function createOrderFromDraft(draft, sequenceNumber) {
  var safeDraft = draft || createEmptyDraftOrder();
  var now = new Date().toISOString();

  var order = deepCloneOrder(safeDraft);
  order.id = generateOrderId();
  order.code = generateOrderCode(sequenceNumber);
  order.status = ORDER_STATUS.WAITING_CONFIRM;
  order.createdAt = now;
  order.updatedAt = now;
  order.summary = recalculateSummary(order);

  return order;
}

/**
 * Deep clone một Order (hoặc bất kỳ object dữ liệu thuần JSON nào).
 * Dùng để tránh việc nhiều nơi trong UI vô tình sửa chung 1 reference.
 * @param {object} order
 * @returns {object}
 */
function deepCloneOrder(order) {
  if (order === null || order === undefined) {
    return order;
  }
  return JSON.parse(JSON.stringify(order));
}
