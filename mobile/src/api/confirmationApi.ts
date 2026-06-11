import { appConfig } from "../config/appConfig";
import type {
  ActiveConfirmationRequest,
  ConfirmationResponseResult,
  ConfirmationResponseType
} from "../types/confirmation";

const parseError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

  return body?.error?.message ?? fallback;
};

export const getActiveConfirmation = async (deviceToken: string) => {
  const response = await fetch(`${appConfig.apiBaseUrl}/devices/me/active-confirmation`, {
    headers: {
      Authorization: `Bearer ${deviceToken}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseError(response, `Confirmation request failed with status ${response.status}`));
  }

  return response.json() as Promise<ActiveConfirmationRequest>;
};

export const submitConfirmationResponse = async (
  deviceToken: string,
  detectionEventId: string,
  responseType: ConfirmationResponseType
) => {
  const response = await fetch(`${appConfig.apiBaseUrl}/confirmation-responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deviceToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      detectionEventId,
      response: responseType
    })
  });

  if (!response.ok) {
    throw new Error(await parseError(response, `Confirmation response failed with status ${response.status}`));
  }

  return response.json() as Promise<ConfirmationResponseResult>;
};

