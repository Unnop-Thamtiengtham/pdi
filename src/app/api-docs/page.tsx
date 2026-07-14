'use client';

import React from 'react';
import Script from 'next/script';

export default function ApiDocsPage() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Load Swagger UI CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css"
      />
      
      {/* Header Bar */}
      <div className="py-5 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold font-sans tracking-wide">GOLD INTEGRATE</h1>
            <p className="text-xs text-slate-400 mt-0.5">PDI Management System API Specifications</p>
          </div>
          <span className="text-xs bg-indigo-600 text-white font-semibold px-3 py-1 rounded-full shadow-sm">
            Swagger OpenAPI 3.0
          </span>
        </div>
      </div>

      {/* Swagger UI target mount element */}
      <div id="swagger-ui" className="max-w-7xl mx-auto px-2 py-4" />

      {/* Load Swagger UI Script */}
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).SwaggerUIBundle) {
            (window as any).SwaggerUIBundle({
              url: '/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                (window as any).SwaggerUIBundle.presets.apis
              ],
              layout: 'BaseLayout',
              persistAuthorization: true
            });
          }
        }}
      />
    </div>
  );
}
