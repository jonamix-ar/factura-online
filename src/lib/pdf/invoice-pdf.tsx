import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatAmount, formatDate } from "@/lib/format";

type Issuer = {
  name: string;
  address: string;
  cityZone: string;
  cuit: string;
  phone: string;
  email: string;
};

type InvoiceItem = {
  description: string;
  amount: number;
};

type InvoicePdfProps = {
  issuer: Issuer;
  number: string;
  date: Date;
  client: {
    name: string;
    address: string;
    zip: string;
    taxId?: string | null;
    email?: string | null;
  };
  job: string;
  conditions: string;
  items: InvoiceItem[];
  ivaPercent: number;
  subtotal: number;
  total: number;
  currency: string;
};

const PRIMARY = "#1e40af";
const PRIMARY_SOFT = "#dbeafe";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BAND = "#1e3a8a";

const styles = StyleSheet.create({
  page: {
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: TEXT,
    paddingTop: 0,
    paddingBottom: 28,
    paddingHorizontal: 0,
  },
  // Top banner
  topBand: {
    flexDirection: "row",
    backgroundColor: BAND,
    paddingHorizontal: 36,
    paddingVertical: 18,
    color: "white",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  topBandLeft: { flexDirection: "column" },
  topBandTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    color: "white",
  },
  topBandSubtitle: {
    fontSize: 9,
    color: PRIMARY_SOFT,
    marginTop: 2,
    letterSpacing: 1,
  },
  topBandRight: { alignItems: "flex-end" },
  topBandNumber: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "white",
  },
  topBandDate: {
    fontSize: 9,
    color: PRIMARY_SOFT,
    marginTop: 2,
  },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 18 },

  // Issuer / client cards
  partiesRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  partyCard: {
    flex: 1,
    border: `1pt solid ${BORDER}`,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  partyLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 3,
  },
  partyLine: {
    color: TEXT,
    marginBottom: 1,
  },
  partyDim: { color: MUTED, marginBottom: 1 },
  link: { color: PRIMARY },

  // Job / conditions strip
  metaStrip: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  metaCell: { flex: 1 },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  metaValue: { color: TEXT },

  // Items table
  table: {
    border: `1pt solid ${BORDER}`,
    borderRadius: 4,
    overflow: "hidden",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    color: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  thIndex: {
    width: 24,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "white",
  },
  thDesc: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "white",
    letterSpacing: 0.6,
  },
  thAmount: {
    width: 110,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "white",
    textAlign: "right",
    letterSpacing: 0.6,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${BORDER}`,
    minHeight: 22,
  },
  trZebra: { backgroundColor: "#f8fafc" },
  tdIndex: { width: 24, color: MUTED },
  tdDesc: { flex: 1, color: TEXT },
  tdAmount: {
    width: 110,
    color: TEXT,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },

  // Totals
  totalsWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  totalsBox: {
    width: 230,
    border: `1pt solid ${BORDER}`,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${BORDER}`,
  },
  totalsLabel: { color: MUTED },
  totalsValue: { color: TEXT, fontFamily: "Helvetica-Bold" },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: PRIMARY,
  },
  totalLabelFinal: {
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 0.6,
  },
  totalValueFinal: {
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTop: `1pt solid ${BORDER}`,
    flexDirection: "row",
    justifyContent: "space-between",
    color: MUTED,
    fontSize: 8,
  },
});

export function InvoicePdf(props: InvoicePdfProps) {
  const {
    issuer,
    number,
    date,
    client,
    job,
    conditions,
    items,
    ivaPercent,
    subtotal,
    total,
    currency,
  } = props;
  const ivaAmount = total - subtotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand}>
          <View style={styles.topBandLeft}>
            <Text style={styles.topBandTitle}>FACTURA</Text>
            <Text style={styles.topBandSubtitle}>
              EMISIÓN: {formatDate(date)}
            </Text>
          </View>
          <View style={styles.topBandRight}>
            <Text style={styles.topBandNumber}>N.º {number}</Text>
            <Text style={styles.topBandDate}>{issuer.name.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.partiesRow}>
            <View style={styles.partyCard}>
              <Text style={styles.partyLabel}>EMISOR</Text>
              <Text style={styles.partyName}>{issuer.name}</Text>
              <Text style={styles.partyLine}>{issuer.address}</Text>
              <Text style={styles.partyDim}>{issuer.cityZone}</Text>
              <Text style={styles.partyDim}>CUIT {issuer.cuit}</Text>
              <Text style={styles.partyDim}>Tel {issuer.phone}</Text>
              <Text style={styles.link}>{issuer.email}</Text>
            </View>
            <View style={styles.partyCard}>
              <Text style={styles.partyLabel}>FACTURAR A</Text>
              <Text style={styles.partyName}>{client.name}</Text>
              <Text style={styles.partyLine}>{client.address}</Text>
              <Text style={styles.partyDim}>{client.zip}</Text>
              {client.taxId ? (
                <Text style={styles.partyDim}>{client.taxId}</Text>
              ) : null}
              {client.email ? (
                <Text style={styles.link}>{client.email}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaStrip}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>TRABAJO</Text>
              <Text style={styles.metaValue}>{job}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>CONDICIONES</Text>
              <Text style={styles.metaValue}>{conditions || "—"}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.thead}>
              <Text style={styles.thIndex}>#</Text>
              <Text style={styles.thDesc}>DESCRIPCIÓN DE CARGO FINANCIERO</Text>
              <Text style={styles.thAmount}>MONTO</Text>
            </View>
            {items.map((item, idx) => (
              <View
                key={`item-${idx}`}
                style={[styles.tr, idx % 2 === 1 ? styles.trZebra : {}]}
                wrap={false}
              >
                <Text style={styles.tdIndex}>
                  {String(idx + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.tdDesc}>{item.description}</Text>
                <Text style={styles.tdAmount}>
                  {formatAmount(item.amount, currency)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatAmount(subtotal, currency)}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>I.V.A. ({ivaPercent}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatAmount(ivaAmount, currency)}
                </Text>
              </View>
              <View style={styles.totalRowFinal}>
                <Text style={styles.totalLabelFinal}>TOTAL A PAGAR</Text>
                <Text style={styles.totalValueFinal}>
                  {formatAmount(total, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {issuer.name} · CUIT {issuer.cuit}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
