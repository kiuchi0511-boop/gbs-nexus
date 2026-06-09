import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { PDF_COLORS } from '@/components/pdf/pdf-colors'
import { getPdfImageUrls } from '@/lib/pdf-assets'
import type { CompanySettings } from '@/types/database'
import type { Estimate } from '@/types/estimate'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    backgroundColor: PDF_COLORS.white,
    position: 'relative',
  },
  leftVerticalLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: PDF_COLORS.accent,
  },
  topBlackLine: {
    height: 8,
    backgroundColor: PDF_COLORS.black,
    marginLeft: 5,
  },
  topAccentRow: {
    flexDirection: 'row',
    marginLeft: 5,
    marginBottom: 40,
  },
  accentOrangeSmall: {
    width: 40,
    height: 6,
    backgroundColor: PDF_COLORS.accent,
  },
  accentBlackSmall: {
    width: 20,
    height: 6,
    backgroundColor: PDF_COLORS.black,
  },
  content: {
    paddingLeft: 55,
    paddingRight: 50,
    paddingTop: 20,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
  date: {
    fontSize: 11,
    color: PDF_COLORS.gray,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 12,
    marginBottom: 6,
  },
  titleUnderline: {
    width: 220,
    height: 2,
    backgroundColor: PDF_COLORS.black,
    marginBottom: 50,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.black,
    paddingBottom: 6,
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  jobLabel: {
    fontSize: 11,
    color: PDF_COLORS.gray,
    marginBottom: 4,
  },
  jobName: {
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.black,
    paddingBottom: 4,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 55,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  companyBlock: {
    maxWidth: 300,
    lineHeight: 1.6,
  },
  companyName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  department: {
    fontSize: 9,
    marginBottom: 6,
    color: PDF_COLORS.gray,
  },
  companyDetail: {
    fontSize: 8,
    color: PDF_COLORS.gray,
    lineHeight: 1.5,
  },
  logoBlock: {
    alignItems: 'flex-end',
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  titleImage: {
    width: 200,
    height: 50,
    objectFit: 'contain',
  },
  bottomBlackLine: {
    position: 'absolute',
    bottom: 40,
    left: 5,
    right: 0,
    height: 8,
    backgroundColor: PDF_COLORS.black,
  },
  bottomAccentRow: {
    position: 'absolute',
    bottom: 28,
    right: 50,
    flexDirection: 'row',
  },
})

type Props = {
  estimate: Estimate
  company: CompanySettings
}

function formatClientLine(estimate: Estimate): string {
  if (estimate.client_person) {
    return `${estimate.client_name}　${estimate.client_person}様`
  }
  return `${estimate.client_name}　御中`
}

export default function CoverPage({ estimate, company }: Props) {
  const dateStr = format(new Date(estimate.estimate_date), 'yyyy年M月d日')
  const images = getPdfImageUrls()

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.leftVerticalLine} />

      <View style={styles.topBlackLine} />
      <View style={styles.topAccentRow}>
        <View style={styles.accentOrangeSmall} />
        <View style={styles.accentBlackSmall} />
      </View>

      <View style={styles.content}>
        <View style={styles.dateRow}>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <Text style={styles.title}>ご　提　案　書</Text>
        <View style={styles.titleUnderline} />

        <Text style={styles.clientName}>{formatClientLine(estimate)}</Text>

        <View style={styles.jobRow}>
          <Text style={styles.jobLabel}>工事名：</Text>
          <Text style={styles.jobName}>{estimate.job_name}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.companyBlock}>
          <Text style={styles.companyName}>{company.company_name}</Text>
          {company.department && (
            <Text style={styles.department}>{company.department}</Text>
          )}
          {company.postal_code && (
            <Text style={styles.companyDetail}>{company.postal_code}</Text>
          )}
          {company.address && (
            <Text style={styles.companyDetail}>{company.address}</Text>
          )}
          {company.tel && (
            <Text style={styles.companyDetail}>TEL：{company.tel}</Text>
          )}
          {company.fax && (
            <Text style={styles.companyDetail}>FAX：{company.fax}</Text>
          )}
          {company.email && (
            <Text style={styles.companyDetail}>Mail：{company.email}</Text>
          )}
        </View>

        <View style={styles.logoBlock}>
          <Image src={images.logo} style={styles.logoImage} />
          <Image src={images.title} style={styles.titleImage} />
        </View>
      </View>

      <View style={styles.bottomBlackLine} />
      <View style={styles.bottomAccentRow}>
        <View style={styles.accentOrangeSmall} />
        <View style={styles.accentBlackSmall} />
      </View>
    </Page>
  )
}
