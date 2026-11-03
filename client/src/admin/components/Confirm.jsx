import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmContext = createContext(() => Promise.resolve(false));

/** Fenêtre modale accessible : piège le focus et se ferme avec Échap. */
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} className={`m-auto w-[calc(100%-2rem)] rounded-lg bg-white p-6 shadow-xl backdrop:bg-ink/50 ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
      <h2 className="mb-3 text-2xl">{title}</h2>
      {children}
    </dialog>
  );
}

export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const [request, setRequest] = useState(null);
  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);
  const answer = (value) => {
    request.resolve(value);
    setRequest(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} onClose={() => answer(false)}>
          {request.text && <p className="text-ink-soft">{request.text}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => answer(false)}>{t('admin.editor.cancel')}</button>
            <button type="button" className={`btn btn-sm ${request.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => answer(true)}>{request.action ?? t('admin.confirm')}</button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
