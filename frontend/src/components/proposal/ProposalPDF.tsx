/**
 * BuildINT-branded multi-page proposal PDF
 * Layout mirrors provided reference (cover, about, why, services, terms)
 */

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Client, ProposalLineItem } from '@/types';
import { formatDate } from '@/lib/utils';
import { DEFAULT_TERMS_CONDITIONS } from '@/constants/proposalDefaults';

const buildLogo = '/img/BuildINT.png';
const elephantLogo = '/img/elephant.png';
// Use the exact filenames that exist in public/img (spaces must be URL-encoded)
const aboutImage = '/img/2nd%20page.png';
const whyImage = '/img/3rd%20page.png';

const colors = {
  dark: '#111827',
  gray: '#4B5563',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  green: '#6CC04A',
  greenDark: '#2D8C3C',
  watermark: '#E5E7EB',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    paddingTop: 32,
    paddingBottom: 42,
    paddingHorizontal: 32,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    fontSize: 48,
    color: colors.watermark,
    transform: 'rotate(-35deg)',
    opacity: 0.35,
    fontWeight: 700,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: { width: 130, height: 42, objectFit: 'contain' },
  smallMeta: { fontSize: 10, color: colors.gray },
  smallMetaLabel: { fontSize: 10, color: colors.gray, textTransform: 'uppercase' },
  coverTitle: { fontSize: 48, fontWeight: 900, color: colors.dark, marginBottom: 6 },
  coverSubtitle: { fontSize: 16, color: colors.dark, marginTop: 4 },
  underline: { width: 140, height: 3, backgroundColor: colors.dark, marginTop: 4, marginBottom: 12 },
  preparedLabel: { fontSize: 10, color: colors.dark, marginBottom: 4 },
  preparedValue: { fontSize: 12, color: colors.dark, fontWeight: 700 },
  sectionTitle: { fontSize: 22, fontWeight: 800, color: colors.dark, marginBottom: 12 },
  paragraph: { fontSize: 10, color: colors.gray, lineHeight: 1.35, marginBottom: 8 },
  greenPanel: {
    backgroundColor: '#DAF2D9',
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B7E4B6',
  },
  listTitle: { fontSize: 12, fontWeight: 800, color: colors.dark, marginBottom: 8 },
  listItem: { fontSize: 10, color: colors.dark, marginBottom: 4 },
  listBullet: { fontWeight: 800, marginRight: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  tableContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: { fontSize: 9, fontWeight: 800, color: colors.dark },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  rowAlt: { backgroundColor: '#F9FAFB' },
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  tableCellLast: { borderRightWidth: 0 },
  cellText: { fontSize: 9, color: colors.dark },
  cellNumber: { fontSize: 9, color: colors.dark, textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  summaryBox: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: '52%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#E6F4EA',
  },
  footerBar: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 9, color: colors.gray, lineHeight: 1.3 },
  footerLogo: { width: 60, height: 32, objectFit: 'contain' },
  footerElephant: { width: 46, height: 30, objectFit: 'contain' },
  smallMuted: { fontSize: 9, color: colors.lightGray },
});

interface ProposalPDFProps {
  proposalNumber: string;
  proposalTitle?: string;
  client: Client;
  items: ProposalLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil?: Date | null;
  notes?: string;
  termsConditions?: string;
  createdAt?: Date;
  createdByName?: string;
}

const Footer = () => (
  <View style={styles.footerBar}>
    <View>
      <Text style={styles.footerText}>4th Floor, Srishti Plaza, Tunga Village, Chandivali, Powai, Mumbai 400072</Text>
      <Text style={styles.footerText}>support@buildint.co   |   www.buildint.co</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image src={elephantLogo} style={styles.footerElephant} />
      <View style={{ width: 6 }} />
      <Image src={buildLogo} style={styles.footerLogo} />
    </View>
  </View>
);

const Watermark = () => <Text style={styles.watermark}>CONFIDENTIAL</Text>;

export function ProposalPDF({
  proposalNumber,
  proposalTitle,
  client,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  validUntil,
  notes,
  termsConditions,
  createdAt = new Date(),
  createdByName,
}: ProposalPDFProps) {
  const proposalName = proposalTitle?.trim() || 'IoT / CCTV / BMS';
  const proposalDate = formatDate(createdAt);
  const month = new Date(createdAt).toLocaleString('en-US', { month: 'long' }).toUpperCase();

  const termsText = (termsConditions && termsConditions.trim()) || DEFAULT_TERMS_CONDITIONS;
  const termLines = termsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let termCounter = 0;
  let useNumbering = true;

  const formatMoney = (amount: number) =>
    `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns = [
    { key: 'sn', label: 'S.N.', width: '8%', align: 'center' as const },
    { key: 'description', label: 'Description of Items', width: '28%', align: 'left' as const },
    { key: 'unit', label: 'Unit', width: '8%', align: 'center' as const },
    { key: 'qty', label: 'Qty', width: '8%', align: 'center' as const },
    { key: 'rate', label: 'Rate', width: '12%', align: 'right' as const },
    { key: 'amount', label: 'Amount', width: '14%', align: 'right' as const },
    { key: 'make', label: 'Make', width: '10%', align: 'left' as const },
    { key: 'model', label: 'Model No.', width: '12%', align: 'left' as const },
  ];

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={styles.headerRow}>
          <Image src={buildLogo} style={styles.logo} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallMetaLabel}>{month}</Text>
            <Text style={styles.smallMeta}>{proposalDate}</Text>
          </View>
        </View>

        <View style={{ marginTop: 40, marginBottom: 40 }}>
          <Text style={styles.coverTitle}>PROPOSAL</Text>
          <View style={styles.underline} />
          <Text style={styles.coverSubtitle}>{proposalName}</Text>
          <Text style={styles.smallMuted}>Proposal No: {proposalNumber}</Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <Text style={styles.preparedLabel}>Prepared For:</Text>
          <Text style={styles.preparedValue}>{client.companyName || 'Client'}</Text>
          {client.contactName && <Text style={styles.smallMeta}>Attn: {client.contactName}</Text>}
          {client.contactEmail && <Text style={styles.smallMeta}>{client.contactEmail}</Text>}
          {client.billingAddress && <Text style={styles.smallMeta}>{client.billingAddress}</Text>}
          {createdByName && (
            <Text style={styles.smallMeta}>Created / Managed by: {createdByName}</Text>
          )}
        </View>

        <Footer />
      </Page>

      {/* About Page */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.sectionTitle}>ABOUT BUILDINT</Text>

        <Image
          src={aboutImage}
          style={{ width: '100%', height: 300, objectFit: 'cover', objectPosition: 'center', alignSelf: 'stretch', borderRadius: 6, marginBottom: 6 }}
        />

        <View style={styles.divider} />

        <Text style={styles.paragraph}>
          BuildINT, as the name suggests, stands for Building Intelligence. It is an IoT-based Energy Management System that provides real-time information on an organization's energy consumption across its building premises.
        </Text>
        <Text style={styles.paragraph}>
          With our IoT solution, you can understand how and where energy is being utilized, enabling facility managers to optimize energy consumption through effective monitoring, data analysis, and reporting generation. This helps in reducing energy wastage, increasing operational efficiency, and supporting a greener, low-carbon footprint.
        </Text>
        <Text style={styles.paragraph}>
          At BuildINT, we are a team of professionals dedicated and passionate about improving building energy performance. Through a tailored and specifically designed combination of IoT networks and intelligent systems, we optimize energy usage by continuous monitoring and automated control.
        </Text>
        <Text style={styles.paragraph}>
          Our platform also predicts electrical energy (kWh) consumption based on the data collected and processed, thereby improving system reliability and performance.
        </Text>
        <Text style={styles.paragraph}>
          Our aim is to provide automated, intelligent, and high-quality engineering services by combining advanced technologies with the highest standards, helping organizations achieve sustainable energy savings and improved operational outcomes.
        </Text>

        <Footer />
      </Page>

      {/* Why Page */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.sectionTitle}>WHY BUILDINT?</Text>

        <Image
          src={whyImage}
          style={{ width: '100%', height: 360, objectFit: 'contain', alignSelf: 'stretch', borderRadius: 6, marginBottom: 8 }}
        />

        <View style={styles.divider} />

        <View style={styles.greenPanel}>
          <Text style={styles.listTitle}>Our Services</Text>
          {[
            'Real-Time Energy Monitoring across your building premises with live data visualization.',
            'Data Analysis & Reporting for performance evaluation and compliance.',
            'Predictive Energy Performance and kWh forecasting using AI-driven analytics.',
            'Automated Control Systems to optimize energy usage.',
            'Custom IoT Network Design tailored to your building\'s unique requirements.',
          ].map((text) => (
            <Text key={text} style={styles.listItem}>
              <Text style={styles.listBullet}>• </Text>
              {text}
            </Text>
          ))}

          <View style={{ marginTop: 12 }}>
            <Text style={styles.listTitle}>Why Choose Us?</Text>
            {[
              'Cost Savings: Reduce energy wastage and operational costs.',
              'Sustainability: Lower carbon footprint and support green initiatives.',
              'Reliability: Advanced IoT architecture ensures consistent performance.',
              'Scalability: Solutions designed to grow with your organization.',
              'Compliance & Transparency: Easy reporting for audits and regulatory needs.',
            ].map((text) => (
              <Text key={text} style={styles.listItem}>
                <Text style={styles.listBullet}>• </Text>
                {text}
              </Text>
            ))}
          </View>
        </View>

        <Footer />
      </Page>

      {/* Services / Items Page */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.sectionTitle}>SERVICE</Text>
        <Text style={styles.smallMuted}>{proposalName}</Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            {columns.map((col, idx) => (
              <View
                key={col.key}
                style={[
                  styles.tableCell,
                  { width: col.width },
                  idx === columns.length - 1 ? styles.tableCellLast : {},
                ]}
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    col.align === 'right'
                      ? styles.textRight
                      : col.align === 'center'
                      ? styles.textCenter
                      : styles.textLeft,
                  ]}
                >
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.rowAlt : {},
                index === items.length - 1 ? styles.tableRowLast : {},
              ]}
            >
              {columns.map((col, idx) => {
                let value: string | number = '';

                switch (col.key) {
                  case 'sn':
                    value = index + 1;
                    break;
                  case 'description':
                    value = item.name || `${item.make} ${item.model}`;
                    break;
                  case 'unit':
                    value = 'Nos';
                    break;
                  case 'qty':
                    value = item.quantity;
                    break;
                  case 'rate':
                    value = formatMoney(item.price);
                    break;
                  case 'amount':
                    value = formatMoney(item.lineTotal);
                    break;
                  case 'make':
                    value = item.make;
                    break;
                  case 'model':
                    value = item.model;
                    break;
                  default:
                    value = '';
                }

                return (
                  <View
                    key={col.key}
                    style={[
                      styles.tableCell,
                      { width: col.width },
                      idx === columns.length - 1 ? styles.tableCellLast : {},
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        col.align === 'right'
                          ? styles.textRight
                          : col.align === 'center'
                          ? styles.textCenter
                          : styles.textLeft,
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.cellText}>Sub-Total</Text>
            <Text style={styles.cellNumber}>{formatMoney(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.cellText}>Add GST @ {taxRate}%</Text>
            <Text style={styles.cellNumber}>{formatMoney(taxAmount)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text style={[styles.cellText, { fontWeight: 800 }]}>Total amount incl GST</Text>
            <Text style={[styles.cellNumber, { fontWeight: 800 }]}>{formatMoney(total)}</Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* Payment & Terms Page */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.sectionTitle}>Payment and Terms</Text>
        <Text style={styles.listTitle}>Terms and Conditions</Text>
        {termLines.map((line, idx) => {
          const isHeading = line.endsWith(':');
          if (isHeading) {
            const headingText = line.replace(/:$/, '');
            if (/technical/i.test(headingText)) {
              useNumbering = false;
              termCounter = 0;
            }
            return (
              <Text
                key={`heading-${idx}`}
                style={[styles.listTitle, { marginTop: idx === 0 ? 0 : 10 }]}
              >
                {headingText}
              </Text>
            );
          }

          const bulletLabel = useNumbering ? `${++termCounter}. ` : '• ';
          return (
            <Text key={`term-${idx}`} style={styles.listItem}>
              <Text style={styles.listBullet}>{bulletLabel}</Text>
              {line}
            </Text>
          );
        })}

        {notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.listTitle}>Notes</Text>
            <Text style={styles.paragraph}>{notes}</Text>
          </View>
        )}

        {validUntil && <Text style={styles.smallMuted}>Proposal valid until: {formatDate(validUntil)}</Text>}

        <Footer />
      </Page>
    </Document>
  );
}
