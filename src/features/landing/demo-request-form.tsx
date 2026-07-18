"use client";

import { useState } from "react";

import styles from "./landing.module.css";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() ?? "";
const IS_DEMO_EMAIL_CONFIGURED = DEMO_EMAIL.length > 0;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormValues = {
  name: string;
  workEmail: string;
  company: string;
  dataStack: string;
  useCase: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  workEmail: "",
  company: "",
  dataStack: "",
  useCase: "",
};

export function DemoRequestForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(nextValues: FormValues) {
    const nextErrors: FormErrors = {};

    if (!nextValues.name.trim()) nextErrors.name = "Please add your name.";
    if (!nextValues.workEmail.trim()) {
      nextErrors.workEmail = "Please add your work email.";
    } else if (!EMAIL_PATTERN.test(nextValues.workEmail.trim())) {
      nextErrors.workEmail = "Please use a valid work email.";
    }
    if (!nextValues.company.trim()) nextErrors.company = "Please add your company.";
    if (!nextValues.dataStack.trim()) nextErrors.dataStack = "Please add your current data stack.";
    if (!nextValues.useCase.trim()) nextErrors.useCase = "Please describe the main use case.";

    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !IS_DEMO_EMAIL_CONFIGURED) {
      return;
    }

    const subject = `Dataverse demo request from ${values.company.trim()}`;
    const body = [
      "Dataverse demo request",
      "",
      `Name: ${values.name.trim()}`,
      `Work email: ${values.workEmail.trim()}`,
      `Company: ${values.company.trim()}`,
      `Current data stack: ${values.dataStack.trim()}`,
      "",
      "Primary use case:",
      values.useCase.trim(),
    ].join("\n");

    const mailtoHref = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.assign(mailtoHref);
  }

  const configMessage = IS_DEMO_EMAIL_CONFIGURED
    ? "Your request opens a prefilled email so your team can reply from the right inbox."
    : process.env.NODE_ENV === "development"
      ? "Set NEXT_PUBLIC_DEMO_EMAIL to enable demo requests in development."
      : "NEXT_PUBLIC_DEMO_EMAIL must be configured before launch.";

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.demoForm}>
      <h3>Request a walkthrough</h3>
      <div className={styles.demoFormDesc}>
        A member of our team will reach out within one business day.
      </div>

      <div className={styles.demoRow}>
        <Field
          id="demo-name"
          label="Name"
          placeholder="Ari Chen"
          value={values.name}
          error={errors.name}
          onChange={(value) => updateField("name", value)}
        />
        <Field
          id="demo-email"
          label="Work email"
          placeholder="ari@company.com"
          value={values.workEmail}
          error={errors.workEmail}
          type="email"
          onChange={(value) => updateField("workEmail", value)}
        />
      </div>

      <div className={styles.demoRow}>
        <Field
          id="demo-company"
          label="Company"
          placeholder="Northstar Analytics"
          value={values.company}
          error={errors.company}
          onChange={(value) => updateField("company", value)}
        />
        <Field
          id="demo-stack"
          label="Current data stack"
          placeholder="Snowflake, dbt, Looker"
          value={values.dataStack}
          error={errors.dataStack}
          onChange={(value) => updateField("dataStack", value)}
        />
      </div>

      <Field
        id="demo-use-case"
        label="What would your team ask first?"
        placeholder="e.g. Which accounts have the highest expansion revenue this quarter?"
        value={values.useCase}
        error={errors.useCase}
        multiline
        onChange={(value) => updateField("useCase", value)}
      />

      <div className={styles.demoFooterRow}>
        <p className={styles.demoConfigMessage} aria-live="polite">
          {configMessage}
        </p>
        <button type="submit" disabled={!IS_DEMO_EMAIL_CONFIGURED} className={styles.demoSubmit}>
          Request walkthrough →
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function Field({
  error,
  id,
  label,
  multiline = false,
  onChange,
  placeholder,
  type = "text",
  value,
}: FieldProps) {
  return (
    <div className={styles.demoField}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          rows={5}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? <p className={styles.demoFieldError}>{error}</p> : null}
    </div>
  );
}
