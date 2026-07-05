import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { Estimate } from '@/types/estimate'

const layoutStyles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'NotoSansJP',
    position: 'relative',
  },
  header: {
    borderBottom: '2px solid #1a1a2e',
    paddingBottom: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  imageContainer: {
    width: '100%',
    marginTop: 16,
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutImage: {
    width: '100%',
    maxHeight: 480,
    objectFit: 'contain',
  },
  noImageText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#999999',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 4,
  },
  infoItem: {
    fontSize: 9,
    color: '#444444',
  },
  infoLabel: {
    fontSize: 9,
    color: '#888888',
  },
})

type Props = {
  estimate: Estimate
  siteImageUrl: string | null
}

export default function SiteImagePage({ estimate, siteImageUrl }: Props) {
  const createdDate = format(new Date(estimate.estimate_date), 'yyyy年M月d日')

  return (
    <Page size="A4" style={layoutStyles.page}>
      <View style={layoutStyles.header}>
        <Text style={layoutStyles.title}>現場写真 施工後イメージ</Text>
        <Text style={layoutStyles.subtitle}>
          現場名：{estimate.job_name} ／ 作成日：{createdDate}
        </Text>
      </View>

      <View style={layoutStyles.infoRow}>
        <Text style={layoutStyles.infoLabel}>顧客名：</Text>
        <Text style={layoutStyles.infoItem}>{estimate.client_name}</Text>
        <Text style={layoutStyles.infoLabel}>　見積番号：</Text>
        <Text style={layoutStyles.infoItem}>{estimate.estimate_no}</Text>
      </View>

      <View style={layoutStyles.imageContainer}>
        {siteImageUrl ? (
          <Image src={siteImageUrl} style={layoutStyles.layoutImage} />
        ) : (
          <Text style={layoutStyles.noImageText}>
            現場写真合成イメージが登録されていません。{'\n'}
            見積編集画面の「現場写真シェード合成」から画像を作成・保存してください。
          </Text>
        )}
      </View>

      <View style={layoutStyles.footer}>
        <Text>{estimate.client_name} 様</Text>
        <Text>Ground BIG Shade 施工後イメージ</Text>
        <Text>p.3</Text>
      </View>
    </Page>
  )
}
