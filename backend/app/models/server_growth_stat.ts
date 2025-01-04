import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ServerGrowthStat extends BaseModel {
  @column({ isPrimary: true })
  declare serverId: number

  @column({ columnName: 'weekly_growth' })
  declare weeklyGrowth: number

  @column({ columnName: 'monthly_growth' })
  declare monthlyGrowth: number

  @column({ columnName: 'last_week_average' })
  declare lastWeekAverage: number

  @column({ columnName: 'previous_week_average' })
  declare previousWeekAverage: number

  @column({ columnName: 'last_month_average' })
  declare lastMonthAverage: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare lastUpdated: DateTime
}
