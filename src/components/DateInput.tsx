import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  style?: object;
}

function toDisplay(iso: string): string {
  if (!iso) return '';
  const d = dayjs(iso, 'YYYY-MM-DD', true);
  return d.isValid() ? d.format('DD/MM/YYYY') : iso;
}

function toISO(display: string): string {
  const cleaned = display.replace(/\D/g, '');
  if (cleaned.length < 8) return '';
  const d = dayjs(`${cleaned.slice(4)}${cleaned.slice(2, 4)}${cleaned.slice(0, 2)}`, 'YYYYMMDD', true);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}

function autoMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function DateInput({ label, value, onChange, style }: Props) {
  const [display, setDisplay] = useState(() => toDisplay(value));

  function handleChange(text: string) {
    const masked = autoMask(text);
    setDisplay(masked);
    const iso = toISO(masked);
    if (iso) onChange(iso);
  }

  return (
    <TextInput
      label={`${label} (DD/MM/AAAA)`}
      value={display}
      onChangeText={handleChange}
      keyboardType="numeric"
      mode="outlined"
      style={style}
      maxLength={10}
    />
  );
}
