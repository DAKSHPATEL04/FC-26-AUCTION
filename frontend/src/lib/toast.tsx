import toast from "react-hot-toast";

/**
 * Renders a custom confirmation toast that asks the user to Confirm or Cancel.
 * Replaces window.confirm().
 */
export const confirmAction = (message: string, onConfirm: () => void) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-semibold text-text-primary">{message}</p>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-3 py-1.5 text-xs font-bold bg-accent-blue text-white hover:bg-accent-blue/80 rounded-lg transition-colors shadow-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: "top-center",
      style: {
        background: "#1A1A1A",
        border: "1px solid #333333",
        color: "#EEEEEE",
      },
    }
  );
};

export { toast };
