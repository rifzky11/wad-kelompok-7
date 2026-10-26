function OrderStatusModal({ status, onClose, onDownload }) {
  if (!status) return null;

  const isSuccess = status.type === "success";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-status-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? "✓" : "!"}
        </div>
        <h2 id="order-status-title" className="mt-4 text-xl font-bold text-slate-900">
          {isSuccess ? "Pesanan Berhasil" : "Pesanan Gagal"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{status.message}</p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tutup
          </button>
          {isSuccess && (
            <button
              type="button"
              onClick={onDownload}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Download Struk
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderStatusModal;
