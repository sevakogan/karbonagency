const GHL_API_URL = "https://services.leadconnectorhq.com";

interface GHLContactData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  locationId: string;
  tags?: string[];
  source?: string;
  customFields?: { id: string; value: string }[];
}

export async function createGHLContact(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}) {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.warn("GHL credentials not configured, skipping GHL sync");
    return null;
  }

  // Split name into first/last
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || data.name;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  const contactPayload: Record<string, unknown> = {
    firstName,
    ...(lastName ? { lastName } : {}),
    email: data.email,
    ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
    ...(data.company?.trim() ? { companyName: data.company.trim() } : {}),
    locationId,
    tags: ["karbon-website", "contact-form"],
    source: "Karbon Agency Website",
  };

  // Strip out any undefined/null/empty string values
  const cleanPayload = Object.fromEntries(
    Object.entries(contactPayload).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  const response = await fetch(`${GHL_API_URL}/contacts/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28",
    },
    body: JSON.stringify(cleanPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("GHL API error:", response.status, errorText);
    // Don't throw — we don't want GHL failure to block form submission
    return null;
  }

  const result = await response.json();
  console.log("GHL contact created:", result.contact?.id);
  return result;
}
