---
description: NestJS + Mongoose — запросы, select, индексы, схемы, ObjectId, exists
globs: ["**/schemas/**/*.ts", "**/*.service.ts", "**/migrations/**/*.ts"]
---

# NestJS: Mongoose

## Запросы

- `.lean()` на find/findById/update, где не нужен полный Document.
- После `Model.create()` — `.toObject()` при возврате.
- Не сравнивать `ObjectId` через `===` — только `.toString()`.

## `select` — когда нужны не все поля

Обязательно сужать проекцию, если нужны 1–3 поля, документ большой, метод в цикле/списке, или нужна только проверка существования + поле.

```typescript
const user = await this.userModel.findById(id).select('email role').lean()
const user = await this.userModel.findById(id).select('_id').lean() // только id
```

`exists` / `existsBy*` — без загрузки документа:

```typescript
const exists = await this.userModel.exists({ email })
return !!exists
```

## Операторы обновления

`$set`, `$push`, `$pull` через `findByIdAndUpdate(..., { new: true }).lean()`.

## Индексы

- `index: true` в `@Prop()` для простого поля.
- Составные: `schema.index({ a: 1, b: -1 })` после `SchemaFactory.createForClass`.
- `unique: true` уже создаёт индекс — дублировать `index: true` не нужно.

## Схема (паттерн)

```typescript
export type CountryDocument = HydratedDocument<Country>

@Schema({ timestamps: true })
export class Country {
  @ApiProperty()
  @Prop({ type: String, required: true, unique: true, index: true })
  name: string

  @ApiProperty()
  @Prop({ type: Number, required: false, default: null })
  propertyTax: number

  @ApiProperty()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  userId: mongoose.Schema.Types.ObjectId
}

export const CountrySchema = SchemaFactory.createForClass(Country)
```

- Всегда `HydratedDocument`, `timestamps: true`, `@ApiProperty()` на полях для Swagger.
- Nullable: `{ required: false, default: null }`.
- Вложенные схемы — `schemas/subSchemas/`.

## Service (фрагмент)

```typescript
async get() {
  this.logger.info(`Get all countries`)
  const countries = await this.countryModel.find({}).lean()
  this.logger.info(`Found ${countries?.length} countries`)
  return countries
}

async create(data: CreateCountry) {
  this.logger.info(`Creating country`)
  const country = await this.countryModel.create(data)
  this.logger.info(`Created country: ${country?._id?.toString()}`)
  return country.toObject()
}
```
