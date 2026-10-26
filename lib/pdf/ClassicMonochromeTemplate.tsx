import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ResumePdfData {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentTitle?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    location?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    degree: string;
    field?: string;
    institution: string;
    graduationYear?: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    lineHeight: 1.3,
    color: "#111111",
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 40,
    paddingRight: 40,
  },
  header: {
    marginBottom: 10,
    textAlign: "center",
  },
  name: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Times-Italic",
    fontSize: 10.5,
    color: "#333333",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    fontSize: 8.5,
    color: "#333333",
  },
  contactItem: {
    marginHorizontal: 2,
  },
  contactSeparator: {
    marginHorizontal: 3,
    color: "#666666",
  },
  section: {
    marginTop: 9,
    marginBottom: 3,
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: "#111111",
    paddingBottom: 2,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.35,
    textAlign: "justify",
  },
  jobRow: {
    marginBottom: 6,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 1.5,
  },
  jobTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9.5,
  },
  jobCompanyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2.5,
  },
  jobCompany: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: "#222222",
  },
  jobDates: {
    fontFamily: "Times-Roman",
    fontSize: 8.5,
    color: "#444444",
  },
  bulletList: {
    marginTop: 1,
    paddingLeft: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletPoint: {
    width: 8,
    fontSize: 9,
    lineHeight: 1.25,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.25,
    textAlign: "justify",
  },
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3.5,
  },
  eduDegree: {
    fontFamily: "Times-Bold",
    fontSize: 9,
  },
  eduInstitution: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    color: "#333333",
  },
  eduYear: {
    fontSize: 8.5,
    color: "#444444",
  },
  skillsText: {
    fontSize: 8.5,
    lineHeight: 1.35,
  },
  skillsBold: {
    fontFamily: "Times-Bold",
  },
});

export const ClassicMonochromeTemplate: React.FC<{
  data: ResumePdfData;
  locale?: "en" | "fr";
}> = ({ data, locale = "en" }) => {
  const isFr = locale === "fr";
  const labels = {
    documentTitle: isFr
      ? `${data.fullName || "CV"} - Curriculum Vitae`
      : `${data.fullName || "Resume"} - Resume`,
    summaryTitle: isFr ? "Profil Professionnel" : "Professional Summary",
    experienceTitle: isFr ? "Expérience Professionnelle" : "Work Experience",
    present: isFr ? "Présent" : "Present",
    educationTitle: isFr ? "Formation" : "Education",
    skillsTitle: isFr ? "Compétences & Expertises" : "Skills & Competencies",
    coreCompetencies: isFr ? "Compétences clés : " : "Core Competencies: ",
  };

  // Collect contact line items
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.location) contactParts.push(data.location);
  if (data.linkedinUrl) {
    const cleanLinkedin = data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanLinkedin);
  }
  if (data.portfolioUrl) {
    const cleanPortfolio = data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(cleanPortfolio);
  }

  const validExperiences = (data.experience || [])
    .filter((exp) => exp.company?.trim() || exp.title?.trim())
    .slice(0, 3);

  const validEducations = (data.education || [])
    .filter((edu) => edu.institution?.trim() || edu.degree?.trim())
    .slice(0, 3);

  const validSkills = (data.skills || []).filter((s) => Boolean(s && s.trim())).slice(0, 12);

  return (
    <Document title={labels.documentTitle} author={data.fullName || "Candidate"}>
      <Page size="LETTER" style={styles.page}>
        {/* Header Block */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName || (isFr ? "Nom du Candidat" : "Candidate Name")}</Text>
          {data.currentTitle ? <Text style={styles.title}>{data.currentTitle}</Text> : null}
          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  <Text style={styles.contactItem}>{item}</Text>
                  {idx < contactParts.length - 1 && <Text style={styles.contactSeparator}>•</Text>}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Professional Summary */}
        {data.summary && data.summary.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.summaryTitle}</Text>
            <Text style={styles.summaryText}>{data.summary.trim()}</Text>
          </View>
        ) : null}

        {/* Work Experience */}
        {validExperiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.experienceTitle}</Text>
            {validExperiences.map((exp, idx) => {
              const currentText = exp.isCurrent ? labels.present : exp.endDate;
              const dateRange = [exp.startDate, currentText]
                .filter(Boolean)
                .join(" - ");

              return (
                <View key={idx} style={styles.jobRow}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{exp.title || (isFr ? "Rôle" : "Role")}</Text>
                    {dateRange ? <Text style={styles.jobDates}>{dateRange}</Text> : null}
                  </View>
                  <View style={styles.jobCompanyRow}>
                    <Text style={styles.jobCompany}>{exp.company || ""}</Text>
                    {exp.location ? <Text style={styles.jobDates}>{exp.location}</Text> : null}
                  </View>

                  {exp.bullets && exp.bullets.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.bullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {validEducations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.educationTitle}</Text>
            {validEducations.map((edu, idx) => (
              <View key={idx} style={styles.eduRow}>
                <View>
                  <Text style={styles.eduDegree}>
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                </View>
                {edu.graduationYear ? <Text style={styles.eduYear}>{edu.graduationYear}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {validSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.skillsTitle}</Text>
            <Text style={styles.skillsText}>
              <Text style={styles.skillsBold}>{labels.coreCompetencies}</Text>
              {validSkills.join(" • ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
