import Image from "next/image";
import Badge from "@/components/ui/badge";
import type { Client } from "@/types";

interface ClientInfoCardProps {
  readonly client: Client;
}

function SocialIcon({ type }: { readonly type: "instagram" | "facebook" }) {
  if (type === "instagram") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function ClientInitials({ name }: { readonly name: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
      {initials}
    </div>
  );
}

export default function ClientInfoCard({ client }: ClientInfoCardProps) {
  const hasSocials = client.instagram_url || client.facebook_url;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-orange-500" />

      <div className="p-6">
        <div className="flex items-start gap-5">
          {/* Avatar / Logo */}
          {client.logo_url ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border border-gray-100">
              <Image
                src={client.logo_url}
                alt={`${client.name} logo`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <ClientInitials name={client.name} />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {client.name}
              </h2>
              <Badge variant={client.is_active ? "active" : "lost"}>
                {client.is_active ? "Active" : "Inactive"}
              </Badge>
              {/* Meta connection badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
                  client.meta_ad_account_id
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-400"
                }`}
                title={
                  client.meta_ad_account_id
                    ? `Ad Account: ${client.meta_ad_account_id}`
                    : "Meta not connected"
                }
              >
                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                </svg>
                <span className={`w-1.5 h-1.5 rounded-full ${client.meta_ad_account_id ? "bg-green-500" : "bg-gray-400"}`} />
                {client.meta_ad_account_id ? "Meta" : "No Meta"}
              </span>
            </div>

            {client.company_name && (
              <p className="text-sm text-gray-500 mb-3">{client.company_name}</p>
            )}

            {/* Contact details */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              {client.contact_email && (
                <a
                  href={`mailto:${client.contact_email}`}
                  className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {client.contact_email}
                </a>
              )}

              {client.contact_phone && (
                <a
                  href={`tel:${client.contact_phone}`}
                  className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {client.contact_phone}
                </a>
              )}
            </div>

            {/* Social links */}
            {hasSocials && (
              <div className="flex items-center gap-3 mt-3">
                {client.instagram_url && (
                  <a
                    href={client.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-pink-600 transition-colors text-sm"
                  >
                    <SocialIcon type="instagram" />
                    <span>Instagram</span>
                  </a>
                )}
                {client.facebook_url && (
                  <a
                    href={client.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors text-sm"
                  >
                    <SocialIcon type="facebook" />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
