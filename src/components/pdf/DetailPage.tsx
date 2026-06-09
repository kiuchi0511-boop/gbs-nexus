import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { addDays, format } from 'date-fns'
import { PDF_COLORS } from '@/components/pdf/pdf-colors'
import { getPdfImageUrls } from '@/lib/pdf-assets'
import { calcSummary, formatJPY } from '@/lib/calculations'
import type { CompanySettings } from '@/types/database'
import { SECTION_NAMES, type Estimate, type EstimateItem, type SectionType } from '@/types/estimate'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 8,
    padding: 40,
    paddingBottom: 60,
    backgroundColor: PDF_COLORS.white,
    position: 'relative',
  },
  accentBar: {
    flexDirection: 'row',
    height: 4,
    marginBottom: 16,
    marginHorizontal: -40,
    marginTop: -40,
  },
  accentOrange: { flex: 3, backgroundColor: PDF_COLORS.accent },
  accentBlack: { flex: 1, backgroundColor: PDF_COLORS.black },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  companyHeader: {
    fontSize: 8,
    color: PDF_COLORS.gray,
    marginBottom: 4,
  },
  headerLogo: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    color: PDF_COLORS.black,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 8,
  },
  metaLabel: { color: PDF_COLORS.gray },
  totalBox: {
    marginVertical: 12,
    padding: 14,
    backgroundColor: PDF_COLORS.totalBox,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 9, color: PDF_COLORS.gray, marginBottom: 4 },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: PDF_COLORS.accent },
  table: { marginTop: 8, borderWidth: 1, borderColor: PDF_COLORS.border },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.sectionHeader,
    color: PDF_COLORS.white,
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: 'bold',
    fontSize: 7,
  },
  sectionRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.sectionHeader,
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontWeight: 'bold',
    fontSize: 8,
    color: PDF_COLORS.white,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
  },
  tableRowStripe: {
    backgroundColor: PDF_COLORS.stripe,
  },
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.subtotalBg,
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    fontWeight: 'bold',
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
  },
  colName: { flex: 3.5 },
  colQty: { flex: 0.8, textAlign: 'right' },
  colUnit: { flex: 0.7, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colAmount: { flex: 1.2, textAlign: 'right' },
  colNote: { flex: 1.6 },
  summaryBox: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: 240,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
    padding: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
    fontSize: 8,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    fontWeight: 'bold',
    fontSize: 9,
    backgroundColor: PDF_COLORS.subtotalBg,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  footer: {
    marginTop: 16,
    fontSize: 7,
    lineHeight: 1.6,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 10,
  },
  footerTitle: { fontWeight: 'bold', marginBottom: 3, color: PDF_COLORS.black },
  issuer: {
    marginTop: 8,
    fontSize: 7,
    color: PDF_COLORS.gray,
    lineHeight: 1.5,
  },
})

const SECTIONS = [1, 2, 3, 4] as SectionType[]

type Props = {
  estimate: Estimate
  items: EstimateItem[]
  company: CompanySettings
}

export default function DetailPage({ estimate, items, company }: Props) {
  const summary = calcSummary(items, estimate.discount_amount)
  const dateStr = format(new Date(estimate.estimate_date), 'yyyy年M月d日')
  const validUntil = format(addDays(new Date(estimate.estimate_date), 30), 'yyyy年M月d日')
  const images = getPdfImageUrls()

  let rowIndex = 0

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.accentBar}>
        <View style={styles.accentOrange} />
        <View style={styles.accentBlack} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyHeader}>{company.company_name}</Text>
          <Text style={styles.title}>お 見 積 書</Text>
        </View>
        <Image src={images.logo} style={styles.headerLogo} />
      </View>

      <View style={styles.metaRow}>
        <Text>
          <Text style={styles.metaLabel}>見積番号：</Text>
          {estimate.estimate_no}
        </Text>
        <Text>
          <Text style={styles.metaLabel}>日付：</Text>
          {dateStr}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text>
          <Text style={styles.metaLabel}>宛先：</Text>
          {estimate.client_name} 御中
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>お見積金額（税込）</Text>
        <Text style={styles.totalAmount}>¥{formatJPY(summary.total_with_tax)}-</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>項目名</Text>
          <Text style={styles.colQty}>数量</Text>
          <Text style={styles.colUnit}>単位</Text>
          <Text style={styles.colPrice}>単価</Text>
          <Text style={styles.colAmount}>金額</Text>
          <Text style={styles.colNote}>備考</Text>
        </View>

        {SECTIONS.map((section) => {
          const sectionItems = items
            .filter((i) => i.section === section && i.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (sectionItems.length === 0) return null

          const sectionTotal = sectionItems.reduce(
            (sum, i) => sum + Math.round(i.quantity * i.unit_price),
            0
          )

          return (
            <View key={section}>
              <View style={styles.sectionRow}>
                <Text>{SECTION_NAMES[section]}</Text>
              </View>
              {sectionItems.map((item) => {
                const isStripe = rowIndex % 2 === 1
                rowIndex++
                return (
                  <View
                    key={item.id}
                    style={[styles.tableRow, isStripe ? styles.tableRowStripe : {}]}
                  >
                    <Text style={styles.colName}>{item.item_name}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colUnit}>{item.unit}</Text>
                    <Text style={styles.colPrice}>¥{formatJPY(item.unit_price)}</Text>
                    <Text style={styles.colAmount}>
                      ¥{formatJPY(Math.round(item.quantity * item.unit_price))}
                    </Text>
                    <Text style={styles.colNote}>{item.note ?? ''}</Text>
                  </View>
                )
              })}
              <View style={styles.subtotalRow}>
                <Text style={styles.colName}>{SECTION_NAMES[section]} 小計</Text>
                <Text style={[styles.colAmount, { flex: 4.3, textAlign: 'right' }]}>
                  ¥{formatJPY(sectionTotal)}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text>税抜小計</Text>
          <Text>¥{formatJPY(summary.subtotal)}</Text>
        </View>
        {summary.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text>値引き</Text>
            <Text>-¥{formatJPY(summary.discount)}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text>税抜合計</Text>
          <Text>¥{formatJPY(summary.total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>消費税（10%）</Text>
          <Text>¥{formatJPY(summary.tax)}</Text>
        </View>
        <View style={styles.summaryTotal}>
          <Text>税込合計</Text>
          <Text>¥{formatJPY(summary.total_with_tax)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>有効期限：{validUntil}まで</Text>
        {estimate.notes && (
          <>
            <Text style={styles.footerTitle}>特記事項</Text>
            <Text>{estimate.notes}</Text>
          </>
        )}
        <View style={styles.issuer}>
          <Text>{company.company_name}</Text>
          {company.department && <Text>{company.department}</Text>}
          {company.address && <Text>{company.address}</Text>}
          {company.tel && <Text>TEL：{company.tel}</Text>}
        </View>
      </View>
    </Page>
  )
}
