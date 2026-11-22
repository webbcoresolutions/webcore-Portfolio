import { useEffect, useRef, useState } from 'react';
import { services } from '../data/services';
import { EMAIL } from '../data/company';

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const TYPES = [...services.map((s) => s.name), 'Other'];

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'mail' }
  | { kind: 'error'; message: string };

type Fields = { name: string; email: string; phone: string; type: string; details: string };
const empty: Fields = { name: '', email: '', phone: '', type: '', details: '' };

/** Field limits (also enforced in the browser via maxLength). */
const MAX = { name: 120, email: 254, phone: 32, details: 5000 } as const;
/** Single-line values must never carry line breaks (prevents header injection in the mail subject). */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, ' ').trim();
/** Submissions faster than this are almost certainly automated. */
const MIN_FILL_MS = 2500;

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (f.phone && !/^[+()\d\s-]{7,}$/.test(f.phone.trim())) e.phone = 'Please enter a valid phone number.';
  if (!f.type) e.type = 'Please choose a project type.';
  if (f.details.trim().length < 10) e.details = 'Tell us a little more about your project.';
  return e;
}

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === 'sending') return; // no double submissions
    // Spam protection: a hidden honeypot field, and a minimum time to fill in the form.
    if (honeypot.current?.value || Date.now() - startedAt.current < MIN_FILL_MS) return;
    const found = validate(fields);
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      return;
    }

    if (ENDPOINT) {
      setStatus({ kind: 'sending' });
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name: oneLine(fields.name),
            email: oneLine(fields.email),
            phone: oneLine(fields.phone),
            projectType: fields.type,
            message: fields.details.slice(0, MAX.details),
            _subject: `New enquiry: ${fields.type} (${oneLine(fields.name)})`,
          }),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        setStatus({ kind: 'sent' });
        setFields(empty);
      } catch {
        setStatus({
          kind: 'error',
          message: `We couldn't send your message just now. Please try again or email us at ${EMAIL}.`,
        });
      }
      return;
    }

    // No form backend configured: hand off to the visitor's email client, honestly.
    const subject = `Project enquiry: ${fields.type} (${oneLine(fields.name)})`;
    const body = [
      `Name: ${oneLine(fields.name)}`,
      `Email: ${oneLine(fields.email)}`,
      fields.phone && `Phone: ${oneLine(fields.phone)}`,
      `Project type: ${fields.type}`,
      '',
      fields.details.slice(0, MAX.details),
    ]
      .filter((l): l is string => typeof l === 'string')
      .join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus({ kind: 'mail' });
  };

  const fieldProps = (k: Exclude<keyof Fields, 'type'>) => ({
    id: `f-${k}`,
    name: k,
    value: fields[k],
    onChange: set(k),
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': errors[k] ? `e-${k}` : undefined,
  });

  // Live completeness of the four essentials.
  const essentials = [
    fields.name.trim().length >= 2,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()),
    !!fields.type,
    fields.details.trim().length >= 10,
  ];
  const done = essentials.filter(Boolean).length;

  return (
    <form className="contact-form" noValidate onSubmit={onSubmit} aria-describedby="form-note">
      <div className={`brief-meter ${done === 4 ? 'is-complete' : ''}`} aria-hidden="true">
        <div className="brief-meter__row">
          <span className="mono">Your brief</span>
          <span className="brief-meter__count">
            {done === 4 ? (
              'Ready to send ✓'
            ) : (
              <>
                <strong>{done}</strong> of 4 essentials
              </>
            )}
          </span>
        </div>
        <span className="brief-meter__bar">
          <i style={{ transform: `scaleX(${done / 4})` }} />
        </span>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="f-name">Full Name</label>
          <input type="text" autoComplete="name" required maxLength={MAX.name} placeholder="Your name" {...fieldProps('name')} />
          {errors.name && <span className="field__error" id="e-name">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="f-email">Email Address</label>
          <input type="email" autoComplete="email" inputMode="email" required maxLength={MAX.email} placeholder="you@company.com" {...fieldProps('email')} />
          {errors.email && <span className="field__error" id="e-email">{errors.email}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-phone">
          Phone Number <small>(optional)</small>
        </label>
        <input type="tel" autoComplete="tel" inputMode="tel" maxLength={MAX.phone} placeholder="+971 …" {...fieldProps('phone')} />
        {errors.phone && <span className="field__error" id="e-phone">{errors.phone}</span>}
      </div>

      <fieldset className="field chips" aria-describedby={errors.type ? 'e-type' : undefined}>
        <legend>Project Type</legend>
        <div className="chips__list">
          {TYPES.map((t) => (
            <label key={t} className={`chip ${fields.type === t ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="type"
                value={t}
                checked={fields.type === t}
                onChange={set('type')}
                aria-invalid={!!errors.type || undefined}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
        {errors.type && <span className="field__error" id="e-type">{errors.type}</span>}
      </fieldset>

      <div className="field">
        <label htmlFor="f-details">Project Details</label>
        <textarea
          rows={5}
          required
          maxLength={MAX.details}
          placeholder="Goals, timeline, links, anything that helps us understand the project."
          {...fieldProps('details')}
        />
        {errors.details && <span className="field__error" id="e-details">{errors.details}</span>}
      </div>

      {/* Honeypot: invisible to people and assistive tech; bots tend to fill it. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" ref={honeypot} />
      </div>

      <div className="form-foot">
        <button type="submit" className="btn btn--primary btn--lg" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Send Message'}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="form-note" id="form-note">
          {ENDPOINT
            ? 'All fields except phone are required.'
            : `Sending opens your email app with your message ready to go to ${EMAIL}.`}
        </p>
      </div>

      <div className="form-status" role="status" aria-live="polite">
        {status.kind === 'sent' && (
          <p className="is-ok">Thank you. Your message has been sent and our team will be in touch shortly.</p>
        )}
        {status.kind === 'mail' && (
          <p className="is-info">
            Your email app should now be open with your message pre-filled. Press send there to
            reach us. If nothing opened, email us directly at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        )}
        {status.kind === 'error' && <p className="is-error">{status.message}</p>}
      </div>
    </form>
  );
}
