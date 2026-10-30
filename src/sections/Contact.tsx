import { useId, useState, type FormEvent } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';
import { ArrowUpRight, Github, Mail } from '../components/Icons';

/**
 * O site é estático: o formulário monta um e-mail (mailto) para a pessoa
 * revisar e enviar pelo próprio programa de e-mail. Nada é enviado daqui.
 */
export function Contact() {
  const { content: { contact, ui } } = useLanguage();
  const id = useId();
  const [name, setName] = useState('');
  // Guarda o índice para continuar válido ao trocar de idioma.
  const [profileIndex, setProfileIndex] = useState(0);
  const profile = contact.form.profiles[profileIndex];
  const [message, setMessage] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = `${message.trim()}\n\n— ${name.trim()}${name.trim() ? ' · ' : ''}${profile}`;
    const href = `mailto:${site.contactEmails.join(',')}?subject=${encodeURIComponent(contact.form.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <section id="contato" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__copy">
          <Eyebrow>{contact.eyebrow}</Eyebrow>
          <Heading id="contact-title" title={contact.title} />
          <p className="lead">{contact.lead}</p>
          <ul className="contact__emails">
            {site.contactEmails.map((email) => (
              <li key={email}><a href={`mailto:${email}`}><Mail width={16} height={16} /> {email}</a></li>
            ))}
          </ul>
          <h3 className="contact__links-title">{contact.linksTitle}</h3>
          <ul className="contact__links">
            {contact.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener"><Github width={16} height={16} /> {link.label} <ArrowUpRight width={14} height={14} /><span className="sr-only"> {ui.newTab}</span></a>
              </li>
            ))}
          </ul>
        </div>
        <form className="contact__form" onSubmit={submit}>
          <div className="field">
            <label htmlFor={`${id}-name`}>{contact.form.name}</label>
            <input id={`${id}-name`} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <fieldset className="field">
            <legend>{contact.form.profile}</legend>
            <div className="choices">
              {contact.form.profiles.map((p, i) => (
                <label key={p} className="choice">
                  <input type="radio" name="profile" value={p} checked={profileIndex === i} onChange={() => setProfileIndex(i)} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor={`${id}-msg`}>{contact.form.message}</label>
            <textarea id={`${id}-msg`} name="message" rows={5} required placeholder={contact.form.placeholder} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--cream"><Mail width={18} height={18} /> {contact.form.submit}</button>
          <p className="contact__hint">{contact.form.hint}</p>
        </form>
      </div>
    </section>
  );
}
