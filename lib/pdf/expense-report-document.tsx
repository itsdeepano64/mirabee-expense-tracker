import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import type { CategoryBreakdown, ExpenseWithCategory } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#3A2F2F",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#6BA8BA",
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6BA8BA",
  },
  subtitle: {
    fontSize: 10,
    color: "#7a6e68",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FDF8F3",
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#7a6e68",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#6BA8BA",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EDE4DB",
    padding: 8,
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE4DB",
  },
  colDate: { width: "15%" },
  colDesc: { width: "30%" },
  colCat: { width: "20%" },
  colAmt: { width: "15%", textAlign: "right" },
  colCogs: { width: "10%", textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#7a6e68",
  },
});

type ExpenseReportDocumentProps = {
  expenses: ExpenseWithCategory[];
  breakdown: CategoryBreakdown[];
  startDate: string;
  endDate: string;
  total: number;
  cogsTotal: number;
  logoUrl: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function ExpenseReportDocument({
  expenses,
  breakdown,
  startDate,
  endDate,
  total,
  cogsTotal,
  logoUrl,
}: ExpenseReportDocumentProps) {
  const rangeLabel = `${format(parseISO(startDate), "MMM d, yyyy")} – ${format(parseISO(endDate), "MMM d, yyyy")}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logoUrl} style={styles.logo} />
          <View>
            <Text style={styles.title}>Expense Report</Text>
            <Text style={styles.subtitle}>{rangeLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spend</Text>
            <Text style={styles.summaryValue}>{formatMoney(total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>COGS</Text>
            <Text style={[styles.summaryValue, { color: "#8FAE8B" }]}>
              {formatMoney(cogsTotal)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {breakdown.map((item) => (
          <View key={item.category_id} style={{ marginBottom: 6 }}>
            <Text>
              {item.category_name} — {formatMoney(item.total)} ({item.percentage.toFixed(0)}%)
            </Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Expense Details</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colDate}>Date</Text>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colCat}>Category</Text>
          <Text style={styles.colAmt}>Amount</Text>
          <Text style={styles.colCogs}>COGS</Text>
        </View>
        {expenses.map((e) => (
          <View key={e.id} style={styles.tableRow}>
            <Text style={styles.colDate}>
              {format(parseISO(e.date), "MM/dd/yy")}
            </Text>
            <Text style={styles.colDesc}>{e.description}</Text>
            <Text style={styles.colCat}>{e.category_name}</Text>
            <Text style={styles.colAmt}>{formatMoney(e.amount)}</Text>
            <Text style={styles.colCogs}>{e.is_cogs ? "Yes" : "No"}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Mirabee Flowers — Generated {format(new Date(), "MMM d, yyyy")}
        </Text>
      </Page>
    </Document>
  );
}