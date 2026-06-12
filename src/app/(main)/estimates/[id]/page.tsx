import { notFound } from 'next/navigation'

import { getEstimateImages } from '@/actions/estimate-images'

import { getEstimateStatusLogs, getEstimateWithItems } from '@/actions/estimates'

import EstimateEditForm from '@/components/estimates/EstimateEditForm'



type Props = {

  params: { id: string }

}



export default async function EstimateDetailPage({ params }: Props) {

  const [data, statusLogs, images] = await Promise.all([

    getEstimateWithItems(params.id),

    getEstimateStatusLogs(params.id),

    getEstimateImages(params.id),

  ])

  if (!data) notFound()



  return (

    <EstimateEditForm

      initialData={data}

      initialStatusLogs={statusLogs}

      initialImages={images}

    />

  )

}


