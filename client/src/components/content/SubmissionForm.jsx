import { CheckCircle2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { routePath } from '@/lib/routes';

const EMPTY = { name: '', email: '', phone: '', organization: '', subject: '', message: '', website: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values, consent, requireSubject) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'form.required';
  else if (values.name.trim().length < 2) errors.name = 'form.nameShort';
  if (!values.email.trim()) errors.email = 'form.required';
  else if (!EMAIL.test(values.email.trim())) errors.email = 'form.invalidEmail';
  if (requireSubject && !values.subject.trim()) errors.subject = 'form.required';
  if (!values.message.trim()) errors.message = 'form.required';
  else if (values.message.trim().length < 10) errors.message = 'form.messageShort';
  if (!consent) errors.consent = 'form.consentRequired';
  return errors;
}

const SERVER_FIELD_MESSAGES = { name: 'form.nameShort', email: 'form.invalidEmail', message: 'form.messageShort', subject: 'form.required', consent: 'form.consentRequired' };

/** Formulaire commun (contact et « Nous rejoindre »), validé ici puis de nouveau par le serveur. */
export function SubmissionForm({ type = 'contact', showOrganization = false, showSubject = true }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const startedAt = useRef(Date.now());

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, consent, showSubject);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError(t('form.fixErrors'));
      e.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setFormError('');
    setSending(true);
    try {
      const { website, ...fields } = values;
      await api.post('/api/submissions', {
        ...fields,
        website,
        type,
        consent: true,
        language: i18n.language,
        elapsedMs: Date.now() - startedAt.current,
      });
      setSent(true);
    } catch (err) {
      if (err.code === 'validation' && err.fields) {
        setErrors(Object.fromEntries(Object.keys(err.fields).map((k) => [k, SERVER_FIELD_MESSAGES[k] ?? 'form.required'])));
        setFormError(t('form.fixErrors'));
      } else {
        setFormError(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }));
      }
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setValues(EMPTY);
    setConsent(false);
    setSent(false);
    startedAt.current = Date.now();
  };

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-6">
        <p className="flex items-start gap-3 text-lg font-medium"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-sky-700" /> {t('form.success')}</p>
        <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={reset}>{t('form.sendAnother')}</button>
      </div>
    );
  }

  const field = (name, label, props = {}, Element = 'input') => (
    <div>
      <label htmlFor={`${id}-${name}`} className="label">{label}</label>
      <Element
        id={`${id}-${name}`}
        name={name}
        value={values[name]}
        onChange={onChange}
        className="input"
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && <p id={`${id}-${name}-error`} className="mt-1 text-sm text-red-700">{t(errors[name])}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{formError}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', t('form.name'), { autoComplete: 'name', required: true })}
        {field('email', t('form.email'), { type: 'email', autoComplete: 'email', required: true })}
        {field('phone', t('form.phone'), { type: 'tel', autoComplete: 'tel' })}
        {showOrganization && field('organization', t('form.organization'), { autoComplete: 'organization' })}
      </div>
      {showSubject && field('subject', t('form.subject'), { required: true })}
      {field('message', t('form.message'), { rows: 6, required: true }, 'textarea')}

      <div className="trap" aria-hidden="true">
        <label htmlFor={`${id}-website`}>{t('form.honeypot')}</label>
        <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-[0.9375rem]">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent) setErrors(({ consent: _removed, ...rest }) => rest);
            }}
            aria-invalid={Boolean(errors.consent)}
            className="mt-1 size-4 accent-sky-700"
          />
          <span>
            {t('form.consent')}{' '}
            <Link to={routePath('privacy', i18n.language)} className="font-medium text-sky-800 underline underline-offset-2">{t('form.privacyLink')}</Link>
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-sm text-red-700">{t(errors.consent)}</p>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={sending}>{t(sending ? 'form.sending' : 'form.submit')}</button>
    </form>
  );
}
