'use client'

import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const estimateFormSchema = z.object({
  client_name: z.string().min(1, '顧客名は必須です'),
  client_person: z.string().optional(),
  job_name: z.string().min(1, '工事名は必須です'),
  estimate_no: z.string().min(1, '見積番号は必須です'),
  estimate_date: z.string().min(1, '見積日は必須です'),
  pattern: z.string().optional(),
  duration: z.string().optional(),
  trade_method: z.string().optional(),
  discount_amount: z.number().min(0, '0以上で入力してください'),
  discount_reason: z.string().optional(),
  notes: z.string().optional(),
})

export type EstimateFormValues = z.infer<typeof estimateFormSchema>

type Props = {
  form: UseFormReturn<EstimateFormValues>
}

export default function EstimateForm({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>見積ヘッダー情報</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>顧客名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="株式会社〇〇" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者名</FormLabel>
                  <FormControl>
                    <Input placeholder="山田 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工事名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="〇〇工場 シェード設置工事" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimate_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>見積番号</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimate_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>見積日</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パターン名</FormLabel>
                  <FormControl>
                    <Input placeholder="パターンA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予定工期</FormLabel>
                  <FormControl>
                    <Input placeholder="約30日" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trade_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>取引方法</FormLabel>
                  <FormControl>
                    <Input placeholder="請負" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>値引き額</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount_reason"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>値引き理由</FormLabel>
                  <FormControl>
                    <Input placeholder="値引きの理由" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>特記事項</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="特記事項を入力"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
