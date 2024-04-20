import { QueryFilter } from "src/query/query-filter.type"
import { QueryOperator } from "src/query/query-operator.type"
import { Model } from "./model.class"
export class Comparitor<T extends string | number | symbol> {
    constructor(private readonly data: Record<T, string[]>) {}

    [QueryOperator.eq]:  (value: QueryFilter<Model>['value']) => indexData[value],
    [QueryOperator.gt]:  (value: QueryFilter<Model>['value']) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(value > val) {a.push(...ids) } return a}, []),
    [QueryOperator.gte]: (value: QueryFilter<Model>['value']) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(value >= val) {a.push(...ids) } return a}, []),
    [QueryOperator.in]:  (value: QueryFilter<Model>['value'][]) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(val in value) {a.push(...ids) } return a}, []),
    [QueryOperator.lt]:  (value: QueryFilter<Model>['value']) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(value < val) {a.push(...ids) } return a}, []),
    [QueryOperator.lte]: (value: QueryFilter<Model>['value']) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(value <= val) {a.push(...ids) } return a}, []),
    [QueryOperator.ne]:  (value: QueryFilter<Model>['value']) => Object.entries(indexData).reduce(
      (a, [val, ids]) => { if(value !== val) {a.push(...ids) } return a}, []),
  })