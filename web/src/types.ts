export type BodyType =
  | 'ハッチバック'
  | 'セダン'
  | 'SUV'
  | 'ミニバン'
  | '軽自動車'
  | '商用'
  | 'スポーツ'
  | 'ワゴン'

export type Fuel = 'ハイブリッド' | 'ガソリン' | 'ディーゼル'

export type Destination = 'kanto' | 'chubu' | 'kansai' | 'other'

export type AuctionVenue =
  | '首都圏AA'
  | '横浜AA'
  | '中部AA'
  | '関西AA'
  | '九州AA'
  | '北海道AA'

export type Lot = {
  id: string
  lotNo: string
  venue: AuctionVenue
  auctionDate: string
  startTime: string
  maker: string
  model: string
  trim: string
  year: number
  month: number
  mileage: number
  displacement: number
  fuel: Fuel
  transmission: string
  drive: string
  color: string
  inspection: string
  bodyType: BodyType
  score: string
  exterior: string
  interior: string
  repaired: boolean
  startPrice: number
  expectedPrice: number
  recycleFee: number
  taxRemainder: number
  images: string[]
  sheetImage: string
  headline: string
  story: string
  inspectorNotes: string[]
  equipment: string[]
  featured?: boolean
}
