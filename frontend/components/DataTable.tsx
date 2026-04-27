"use client";

import React from "react";

interface DataTableProps<T> {
  columns: Array<{
    header: string;
    accessor: keyof T;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }>;
  data: T[];
}

export default function DataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th
              key={i}
              style={{
                textAlign: "left",
                padding: "1rem",
                background: "#f9fafb",
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td
                key={colIndex}
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #eee",
                }}
              >
                {col.render
                  ? col.render(row[col.accessor], row)
                  : String(row[col.accessor])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}