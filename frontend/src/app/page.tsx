"use client";

import { useMemo, useState } from "react";

type PreviewRow = {
  receipt_no: number;
  date: string;
  organization: string;
  inn: string;
  item_name: string;
  amount_without_vat: number;
  vat: number;
  total: number;
  filename: string;
};

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [files, setFiles] = useState<File[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState("");

  const totalSum = useMemo(() => {
    return previewRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  }, [previewRows]);

  const totalVat = useMemo(() => {
    return previewRows.reduce((sum, row) => sum + Number(row.vat || 0), 0);
  }, [previewRows]);

  const totalWithoutVat = useMemo(() => {
    return previewRows.reduce(
      (sum, row) => sum + Number(row.amount_without_vat || 0),
      0
    );
  }, [previewRows]);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
    setPreviewRows([]);
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewRows([]);
    setError("");
  };

  const clearAll = () => {
    setFiles([]);
    setPreviewRows([]);
    setError("");
  };

  const buildFormData = () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return formData;
  };

  const handlePreview = async () => {
    if (!files.length) return;
    setLoadingPreview(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/preview-receipts`, {
        method: "POST",
        body: buildFormData(),
      });

      if (!res.ok) {
        throw new Error("Не удалось получить предпросмотр");
      }

      const data = await res.json();
      setPreviewRows(data.rows || []);
    } catch (e) {
      console.error(e);
      setError("Ошибка предпросмотра. Проверь, запущен ли backend на localhost:8000.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!files.length) return;
    setLoadingExcel(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/process-receipts`, {
        method: "POST",
        body: buildFormData(),
      });

      if (!res.ok) {
        throw new Error("Не удалось создать Excel");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "avansoviy_otchet.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Ошибка скачивания Excel. Проверь backend и OpenAI API key.");
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Авансовые отчёты AI</h1>
          <p className="text-slate-600">
            Загрузи чеки, получи предпросмотр строк и скачай Excel-файл.
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow">
          <label className="mb-2 block text-sm font-medium">Загрузка чеков</label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="block w-full rounded-lg border p-3"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handlePreview}
              disabled={!files.length || loadingPreview}
              className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
            >
              {loadingPreview ? "Обрабатываю..." : "Показать предпросмотр"}
            </button>

            <button
              onClick={handleDownload}
              disabled={!files.length || loadingExcel}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-white disabled:opacity-50"
            >
              {loadingExcel ? "Создаю Excel..." : "Скачать Excel"}
            </button>

            <button
              onClick={clearAll}
              disabled={!files.length}
              className="rounded-xl bg-slate-300 px-5 py-3 text-slate-800 disabled:opacity-50"
            >
              Очистить всё
            </button>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Выбрано файлов: {files.length}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Загруженные файлы</h2>

            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{file.name}</div>
                    <div className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Предпросмотр таблицы</h2>

              <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  Без НДС: {totalWithoutVat.toFixed(2)}
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  НДС: {totalVat.toFixed(2)}
                </div>
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  Итого: {totalSum.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border p-2">№</th>
                    <th className="border p-2">Дата</th>
                    <th className="border p-2">Организация</th>
                    <th className="border p-2">ИНН</th>
                    <th className="border p-2">Товар / услуга</th>
                    <th className="border p-2">Без НДС</th>
                    <th className="border p-2">НДС</th>
                    <th className="border p-2">Итого</th>
                    <th className="border p-2">Файл</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50">
                      <td className="border p-2">{row.receipt_no}</td>
                      <td className="border p-2">{row.date}</td>
                      <td className="border p-2">{row.organization}</td>
                      <td className="border p-2">{row.inn}</td>
                      <td className="border p-2">{row.item_name}</td>
                      <td className="border p-2 text-right">
                        {row.amount_without_vat}
                      </td>
                      <td className="border p-2 text-right">{row.vat}</td>
                      <td className="border p-2 text-right">{row.total}</td>
                      <td className="border p-2">{row.filename}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
