"use client";

import { Button } from "@/components/ui/button";
import { FINGERPRINT_HEADER } from "@/constants/configs";
import {
  COMPANY_ENRICHED_CSV_HEADERS,
  PERSON_ENRICHED_CSV_HEADERS,
} from "@/constants/enrich.constants";
import { useEnrichContext } from "@/contexts/enrich-context";
import { useFingerprint } from "@/hooks/fingerprint.hook";
import { useFingerprintToUserMap } from "@/hooks/fingerprintToUser.hook";
import { axios } from "@/lib/axios";
import { jsonToCSV } from "@/utils/jsonToCSV";
import type { AxiosError } from "axios";
import { signIn, useSession } from "next-auth/react";

export const DownloadButton = () => {
  useFingerprintToUserMap();
  const {
    showDownloadButton,
    enrichmentType,
    downloadablePersonData,
    downloadableCompanyData,
  } = useEnrichContext();
  const session = useSession();
  const { getFingerprint } = useFingerprint();

  const onDownloadClick = async () => {
    if (session.status === "unauthenticated") {
      const fingerprint = await getFingerprint();
      signIn("google", {
        callbackUrl: `/?fp=${fingerprint}&action=${enrichmentType}`,
      });
    } else {
      jsonToCSV(
        enrichmentType === "person"
          ? PERSON_ENRICHED_CSV_HEADERS
          : COMPANY_ENRICHED_CSV_HEADERS,
        enrichmentType === "person"
          ? downloadablePersonData.map(
              person =>
                `"${person.full_name ?? ""}","${person.email}","${
                  person.job_title ?? ""
                }","${person.linkedin_url ?? ""}","${
                  person.current_company ?? ""
                }","${person.current_company_domain ?? ""}","${
                  person.email_verified ?? ""
                }","${person.seniority ?? ""}","${
                  person.contact_number ?? ""
                }"`,
            )
          : downloadableCompanyData.map(
              company =>
                `"${company.company_name ?? ""}","${company.domain}","${
                  `https://linkedin.com/${company.linkedin_url}` ?? ""
                }","${company.employee_size_range ?? ""}","${
                  company.estimated_annual_revenue ?? ""
                }","${company.twitter_url ?? ""}","${
                  company.twitter_followers ?? ""
                }","${company.primary_location ?? ""}","${
                  company.founded_at ?? ""
                }","${company.industry ?? ""}"`,
            ),
        `octolane-${enrichmentType}-enrichment.csv`,
      );
    }
  };

  const checkLimit = async () => {
    const fp = await getFingerprint();
    try {
      const { data } = await axios.get("/api/limit", {
        headers: { [FINGERPRINT_HEADER]: fp },
      });
    } catch (err) {
      const error = err as AxiosError;
      if (error.response) {
        console.error(error.response.data);
      }
    }
  };

  return (
    <div className="pb-4 flex flex-col items-center gap-1">
      <Button onClick={checkLimit}>Hello</Button>
      {showDownloadButton ? (
        <Button variant="cta" onClick={onDownloadClick}>
          {session.status === "unauthenticated"
            ? "Register to download"
            : "Download"}
        </Button>
      ) : null}
      <span className={"text-xs text-gray-500 dark:text-gray-400"}>
        {session.status === "unauthenticated" && showDownloadButton
          ? "Work email required!"
          : "No credit card required."}
      </span>
    </div>
  );
};
