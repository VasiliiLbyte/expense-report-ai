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
  const [files, setFiles] = useState<File[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const totalSum = useMemo(
    () => previewRows.reduce((sum, row) => sum + Number(row.total || 0), 0),
    [previewRows]
  );

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
    setPreviewRows([]);
  };

  const buildFormData = () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return formData;
  };

  const handlePreview = async () => {
    if (!files.length) return;
    setLoadingPreview(true);
    try {
      const res = await fetch("http://localhost:8000/api/preview-receipts", {
        method: "POST",
        body: buildFormData(),
      });
      if (!res.ok) throw new Error("Не удалось получить предпросмотр");
      const data = await res.json();
      setPreviewRows(data.rows || []);
    } catch (e) {
      alert("Ошибка предпросмотра");
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!files.length) return;
    setLoadingExcel(true);
    try {
      const res = await fetch("http://localhost:8000/api/process-receipts", {
        method: "POST",
        body: buildFormData(),
      });
      if (!res.ok) throw new Error("Не удалось создать Excel");
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
      alert("Ошибка при скачивании Excel");
      console.error(e);
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">Авансовые отчёты AI</h1>
        <p className="text-slate-600 mb-8">
          Загрузи чеки, посмотри предпросмотр таблицы и скачай Excel.
        </p>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Загрузка чеков</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="block w-full border rounded-lg p-3"
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!files.length || loadingPreview}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              {loadingPreview ? "Обрабатываю..." : "Показать предпросмотр"}
            </button>

            <button
              onClick={handleDownload}
              disabled={!files.length || loadingExcel}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
            >
              {loadingExcel ? "Создаю Excel..." : "Скачать Excel"}
            </button>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Выбрано файлов: {files.length}
          </div>
        </div>

        {previewRows.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Предпросмотр таблицы</h2>
              <div className="text-sm text-slate-600">
                Строк: {previewRows.length} • Итого: {totalSum.toFixed(2)}
              </div>
            </div>

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
                    <td className="border p-2 text-right">{row.amount_without_vat}</td>
                    <td className="border p-2 text-right">{row.vat}</td>
                    <td className="border p-2 text-right">{row.total}</td>
                    <td className="border p-2">{row.filename}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
