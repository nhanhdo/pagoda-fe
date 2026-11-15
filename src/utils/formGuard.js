import { Modal } from 'antd';

/**
 * Close a form modal, asking first if the user has typed anything.
 * Use with <Modal maskClosable={false} onCancel={() => guardedClose(form, close, t)} />.
 */
export function guardedClose(form, close, t) {
  if (form?.isFieldsTouched?.()) {
    Modal.confirm({
      title: t.common.discardTitle,
      content: t.common.discardBody,
      okText: t.common.discard,
      cancelText: t.common.keepEditing,
      okButtonProps: { danger: true },
      onOk: close,
    });
  } else {
    close();
  }
}

/** Localised validation rules shared by all forms. */
export const rules = (t) => {
  const V = t.common.validation;
  // Optional format check: blank / whitespace-only values always pass.
  const optionalFormat = (re, msg) => ({
    validator: (_, v) => {
      const s = v == null ? '' : String(v).trim();
      return !s || re.test(s) ? Promise.resolve() : Promise.reject(new Error(msg));
    },
  });
  return {
    required: (field) => ({ required: true, message: V.required.replace('{field}', field) }),
    select: (field) => ({ required: true, message: V.select.replace('{field}', field) }),
    email: optionalFormat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, V.email),
    phone: optionalFormat(/^(\+84|0)(\d[\s.-]?){8,10}$/, V.phone),
    cccd: optionalFormat(/^(\d{9}|\d{12})$/, V.cccd),
    min: (n) => ({ type: 'number', min: n, message: V.min.replace('{n}', Number(n).toLocaleString('vi-VN')) }),
    notFuture: {
      validator: (_, v) => (v && v.isAfter && v.isAfter(new Date(), 'day') ? Promise.reject(new Error(V.future)) : Promise.resolve()),
    },
    // End must not be before start; `startField` is the other field's name.
    notBefore: (getFieldValue, startField) => ({
      validator: (_, v) => {
        const s = getFieldValue(startField);
        return v && s && v.isBefore && v.isBefore(s, 'day') ? Promise.reject(new Error(V.endBeforeStart)) : Promise.resolve();
      },
    }),
  };
};
