"use client";

import { useState } from "react";
import { formatCurrency, roundMoney } from "@/lib";
import type { EstimateItem, EstimateResult } from "@/types";
import { Icon } from "@/components/common/Icon";

interface QuoteModalProps {
  estimate: EstimateResult;
  items: EstimateItem[];
  onChange: (items: EstimateItem[]) => void;
  onClose: () => void;
  notify: (message: string) => void;
  onSaveDraft: (businessName: string, customerName: string) => void;
  isEditingDraft?: boolean;
}

export function QuoteModal({
  estimate,
  items,
  onChange,
  onClose,
  notify,
  onSaveDraft,
  isEditingDraft = false,
}: QuoteModalProps) {
  const [businessName, setBusinessName] = useState("Your Company");
  const [customerName, setCustomerName] = useState("");
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0,
  );
  const contingency = roundMoney(subtotal * 0.05);
  const taxes = roundMoney(
    (subtotal + contingency) * estimate.location.taxRate,
  );
  const total = subtotal + contingency + taxes;

  const updateItem = (
    index: number,
    field: "quantity" | "rate",
    value: string,
  ) => {
    const numericValue = Math.max(0, Number(value) || 0);
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: numericValue } : item,
      ),
    );
  };

  const printQuote = () => {
    document.body.classList.add("printing-quote");
    window.print();
    window.setTimeout(
      () => document.body.classList.remove("printing-quote"),
      500,
    );
  };

  return (
    <div className="quote-print-shell fixed inset-0 z-[100] overflow-y-auto bg-[#15131b]/65 p-3 backdrop-blur-sm sm:p-6">
      <div
        className="quote-document mx-auto my-3 max-w-5xl overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Editable project quotation"
      >
        <div className="no-print flex items-center justify-between border-b border-[#ebe9f0] px-5 py-4 sm:px-7">
          <div>
            <p className="font-semibold text-[#1d1b25]">Quotation editor</p>
            <p className="mt-0.5 text-xs text-[#777381]">
              Edit any line item before downloading.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#e8e6ec] text-[#5f5c68] transition hover:bg-[#f5f4f7]"
            aria-label="Close quotation editor"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5 sm:p-9">
          <div className="flex flex-col gap-7 border-b border-[#eae8ee] pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#18161f]">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#18161f] text-white">
                  <Icon name="layers" className="h-4 w-4" />
                </span>
                <span className="text-lg font-bold tracking-[-0.03em]">
                  {businessName || "CostCalc quote"}
                </span>
              </div>
              <h2 className="mt-5 max-w-xl text-2xl font-bold tracking-[-0.04em] text-[#1c1a23] sm:text-3xl">
                {estimate.projectTitle}
              </h2>
              <p className="mt-2 text-sm text-[#777481]">
                Prepared for {customerName || "your client"}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f5f3fb] px-5 py-4 text-sm sm:min-w-48">
              <p className="font-semibold text-[#26232e]">
                Quotation QF-2026-0248
              </p>
              <p className="mt-1 text-[#777481]">Valid for 30 days</p>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isEditingDraft ? "bg-[#e9f8f0] text-[#188052]" : "bg-[#e5f6ed] text-[#188052]"}`}>
                {isEditingDraft ? "Estimate" : "Draft"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#46424f]">
              From
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dedbe5] bg-white px-4 py-3 font-semibold text-[#24212c] outline-none transition focus:border-[#6f57e8] focus:ring-4 focus:ring-[#6f57e8]/10"
              />
            </label>
            <label className="block text-sm font-medium text-[#46424f]">
              Prepared for
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Client or company name"
                className="mt-2 w-full rounded-xl border border-[#dedbe5] bg-white px-4 py-3 font-semibold text-[#24212c] outline-none transition focus:border-[#6f57e8] focus:ring-4 focus:ring-[#6f57e8]/10"
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#e6e3eb]">
            <table className="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead className="bg-[#f7f6f9] text-[11px] uppercase tracking-[0.12em] text-[#6f6b78]">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Description</th>
                  <th className="w-28 px-3 py-3.5 font-bold">Qty</th>
                  <th className="w-40 px-3 py-3.5 font-bold">Rate</th>
                  <th className="w-32 px-4 py-3.5 text-right font-bold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe9ef]">
                {items.map((item, index) => (
                  <tr key={item.name}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#292631]">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#817d89]">
                        {item.detail}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        className="w-full rounded-lg border border-[#dedbe5] bg-white px-2.5 py-2 text-right text-sm font-medium text-[#34313c] outline-none focus:border-[#6f57e8]"
                        aria-label={`${item.name} quantity`}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(event) =>
                          updateItem(index, "rate", event.target.value)
                        }
                        className="w-full rounded-lg border border-[#dedbe5] bg-white px-2.5 py-2 text-right text-sm font-medium text-[#34313c] outline-none focus:border-[#6f57e8]"
                        aria-label={`${item.name} rate`}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-[#292631]">
                      {formatCurrency(
                        item.quantity * item.rate,
                        estimate.location,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 ml-auto max-w-sm">
            <div className="flex items-center justify-between border-b border-[#ebe9ef] py-3 text-sm text-[#66626e]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#302d37]">
                {formatCurrency(subtotal, estimate.location)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#ebe9ef] py-3 text-sm text-[#66626e]">
              <span>Contingency (5%)</span>
              <span className="font-semibold text-[#302d37]">
                {formatCurrency(contingency, estimate.location)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#ebe9ef] py-3 text-sm text-[#66626e]">
              <span>Taxes & fees</span>
              <span className="font-semibold text-[#302d37]">
                {formatCurrency(taxes, estimate.location)}
              </span>
            </div>
            <div className="flex items-center justify-between py-5">
              <span className="font-bold text-[#24212b]">Total</span>
              <span className="text-2xl font-bold tracking-[-0.04em] text-[#272331]">
                {formatCurrency(total, estimate.location)}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-[#f7f6f9] p-5 text-xs leading-5 text-[#77727f]">
            This quotation is valid for 30 days. Final pricing may change after
            a detailed review or professional inspection. A 50% deposit may be
            required to begin work.
          </div>
        </div>

        <div className="no-print flex flex-col-reverse gap-3 border-t border-[#ebe9f0] bg-[#faf9fb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-[#77727f]">
            You can edit quantities and rates before downloading.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onSaveDraft(businessName, customerName);
                onClose();
              }}
              className="flex-1 rounded-xl border border-[#dcd8e2] bg-white px-4 py-3 text-sm font-semibold text-[#3e3a46] transition hover:bg-[#f6f5f7] sm:flex-none sm:min-h-[44px]"
            >
              {isEditingDraft ? "Save estimate" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={printQuote}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#6754e7] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(103,84,231,0.22)] transition hover:bg-[#5946d3] sm:flex-none"
            >
              <Icon name="download" className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
