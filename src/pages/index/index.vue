<template>
  <view class="content" :style="contentHeight">
    <view class="result" :style="resultHeight" @touchstart="touchStart" @touchend="touchEnd">
      <view class="number" :style="{ fontSize }">{{ number }}</view>
    </view>
    <view class="calculator" id="calculator">
      <view class="item" :style="itemStyle" v-for="item in calculatorLists" :index="item.value"
        @click="clickCalculator(item)">
        {{ item.value }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import numeral from 'numeral'

const POSITIVE_LENGTH = 11 // 正整数长度 123,123,123
const NEGATIVE_LENGTH = 12 // 负整数长度 -123,123,123
const POSITIVE_DECIMAL_LENGTH = 12 // 正小数长度
const NEGATIVE_DECIMAL_LENGTH = 13 // 负小数长度

interface IITem {
  value: string;
  type: string;
  name?: string;
}
type TNumber = number | undefined

// 动态获取 content / result 区域和 calculator item 高度
const { globalData } = getApp();
const safeAreaInsetBottom = globalData.systemInfo.afeAreaInsets
const itemHeight = globalData.systemInfo.screenWidth / 100 * 23;
const contentHeight = {
  height: `calc(100vh - ${safeAreaInsetBottom}px)`
}
const resultHeight = {
  height: `calc(100vh - ${itemHeight * 5}px - ${safeAreaInsetBottom}px - 90px)` // 90 = 50 margin-bottom 和 padding 40
}
const itemStyle = {
  height: `${itemHeight}px`,
  'line-height': `${itemHeight}px`,
}
const deleteAll = {
  value: 'AC',
  type: 'delete',
  name: 'deleteAll'
}
const deletePrev = {
  value: 'C',
  type: 'delete',
  name: 'deletePrev'
}
const fontSize = ref('140rpx')
const number = ref<string>('0');
const calculatorNumber = ref<number[]>([])
const prevResult = ref<TNumber | string>(); // 上一次的结果
const operator = ref<string | undefined>(); // 当前的运算符号
const prevOperator = ref<string | undefined>(); // 上一个运算符号
const resetNumber = ref<boolean>(false); // 特殊情况用来重置 number
const calculatorLists = ref([
  {
    ...deleteAll
  },
  {
    value: '⁺/-',
    type: 'negative',
  },
  {
    value: '%',
    type: 'percent',
  },
  {
    value: '÷',
    name: 'division',
    type: 'operator',
  },

  {
    value: '7',
    type: 'number',
  },
  {
    value: '8',
    type: 'number',
  },
  {
    value: '9',
    type: 'number',
  },
  {
    value: '×',
    name: 'multiple',
    type: 'operator',
  },

  {
    value: '4',
    type: 'number',
  },
  {
    value: '5',
    type: 'number',
  },
  {
    value: '6',
    type: 'number',
  },
  {
    value: '-',
    name: 'minus',
    type: 'operator',
  },

  {
    value: '1',
    type: 'number',
  },
  {
    value: '2',
    type: 'number',
  },
  {
    value: '3',
    type: 'number',
  },
  {
    value: '+',
    name: 'plus',
    type: 'operator',
  },

  {
    value: '0',
    type: 'number',
  },
  {
    value: '.',
    type: 'point',
  },
  {
    value: '=',
    type: 'equals',
  }
])
// 点击计算器
const clickCalculator = (item: IITem) => {
  const maxLength = getMaxLength()
  switch (item.type) {
    case "number": // 点击数字
      changeNumber(item.value)
      break;
    case "operator": // 运算符号
      prevOperator.value = operator.value ? operator.value : item.name
      operator.value = item.name // 记录当前点击的运算符号
      if (calculatorNumber.value.length === 0) {
        resetNumber.value = true
        return calculatorNumber.value.push(formatNumber(number.value))
      }
      if (calculatorNumber.value.length === 1) {
        calculatorNumber.value.push(formatNumber(number.value))
      }
      if (calculatorNumber.value.length === 2) {
        const result = equalsResult(prevOperator.value);
        calculatorNumber.value = []
        number.value = String(result)
        if (typeof result === 'number') calculatorNumber.value.push(result)
        prevResult.value = result // 记录上一次的计算结果
      }
      break
    case "delete": // AC/C
      if (item.name === 'deleteAll') {
        number.value = '0';
        calculatorNumber.value = []
        prevResult.value = undefined;
        operator.value = undefined;
      } else {
        number.value = '0';
        if (prevResult.value) prevResult.value = undefined;
        if(calculatorNumber.value.length > 1) calculatorNumber.value.pop();
        resetNumber.value = true
      }
      break;
    case "negative": // ⁺/-
      if (number.value.indexOf('-') < 0) number.value = `-${number.value}`
      else number.value = number.value.replace('-', '')
      break;
    case "percent": // %
      if (number.value.length < maxLength) {
        const point = formatPointNumber(Number(number.value) / 100)
        number.value = String(point)
        resetNumber.value = true
      }
      break;
    case "point": // 小数点
      if(number.value.length <= maxLength) return
      if (number.value.indexOf('.') < 0) number.value += '.'
      break;
    case "equals": // 点击 = 号计算结果
      if (calculatorNumber.value.length === 0) return
      if (calculatorNumber.value.length === 1) {
        calculatorNumber.value.push(formatNumber(number.value))
      }
      if (calculatorNumber.value.length === 2) {
        const result = equalsResult(operator.value);
        number.value = String(result)
        prevResult.value = result // 记录上一次的计算结果
        calculatorNumber.value = []
        operator.value = ''; // 计算完成后，清除运算符号
      }
      break;
    default:
      break;
  }
}

const changeNumber = (item: string) => {
  // 上一次计算结果还在，直接点击数字需要先清除上一次计算结果
  if (prevResult.value) {
    prevResult.value = undefined;
    number.value = ''
  }
  // 通过 resetNumber 来控制某些情况的 number 为空
  if (resetNumber.value) {
    resetNumber.value = false
    number.value = ''
  }
  // !firstNumer.value && ['0', '-0'].includes(number.value)) 初始输入数字要先把0去掉
  // C 删除 secondNumber 后，number 会变成 '0'，这时候也要 number.value = ''
  if ((calculatorNumber.value.length === 0 && ['0', '-0'].includes(number.value)) || calculatorNumber.value[0] === Number(number.value)) {
    number.value = ''
  }
  const maxLength = getMaxLength()
  if(number.value.length < maxLength) {
    number.value += item;
    // 处理正负整数
    if(number.value.indexOf('.') === -1) number.value = numeral(number.value).format('0,0')
  }
}

// 当前 number.value 的最大长度
const getMaxLength = () => {
  let maxLength: number = number.value.indexOf('-') !== -1 ? NEGATIVE_LENGTH : POSITIVE_LENGTH;
  if(number.value.indexOf('.') > -1) {
    const _number = number.value.split('.')
    if(_number[0].length < 4) maxLength = maxLength - 1 // 112.123123  -112.123123
    if(_number[0].length > 6) maxLength = maxLength + 1 // 112,112,12.3 -112,112,12.3
  }
  return maxLength
}

// 把 number 的 , 清除掉
const formatNumber = (number: string) => {
  return Number(number.replace(/,/g, ""))
}

// 计算结果
const equalsResult = (operator: string | undefined) => {
  if (calculatorNumber.value.length < 2) return
  let result: string | number = '';
  switch (operator) {
    case "plus":
      result = calculatorNumber.value[0] + calculatorNumber.value[1]
      break;
    case "minus":
      result = calculatorNumber.value[0] - calculatorNumber.value[1]
      break;
    case "multiple":
      result = calculatorNumber.value[0] * calculatorNumber.value[1]
      break;
    case "division":
      result = calculatorNumber.value[1] === 0 ? '错误' : calculatorNumber.value[0] / calculatorNumber.value[1]
      break;
  }
  if (typeof result === 'number') return formatResult(result)
  return result
}

// 点击 & 时，格式化 number
const formatPointNumber = (point: number) => {
  let pointString = String(point)
  const _point = pointString.split('.')
  const pointMaxLength = point < 0 ? NEGATIVE_LENGTH - 1 : POSITIVE_LENGTH - 1; // 计算结果的长度，
  return Number(point.toFixed(pointMaxLength - _point[0].length))
}

// 格式化计算结果
const formatResult = (result: number) => {
  const resultString = String(result);
  const resultMaxLength = result < 0 ? NEGATIVE_LENGTH - 1 : POSITIVE_LENGTH - 1; // 计算结果的长度，小于0的多了-号，所以会多一位
  if (resultString.indexOf('.') > -1) {
    const _result = resultString.split('.')
    return Number(result.toFixed(resultMaxLength - 1 - _result[0].length)) // 把小数点占用的长度 1 去掉
  } else {
    return resultString.length > resultMaxLength ? numeral(result).format('0.e+0') : result
  }
}

const touchStartTime = ref()
const touchStartX = ref()
const touchStartY = ref()
const touchDistance = ref(0)

const touchStart = (event: any) => {
  touchStartTime.value = Date.now()
	touchStartX.value = event.touches[0].clientX;  
	touchStartY.value = event.touches[0].clientY;  
}

const touchEnd = (event: any) => {
  if(Date.now() - touchStartTime.value > 200) return // 手指滑动事件大于 200，视为无效
  let deltaX = event.changedTouches[0].clientX - touchStartX.value;   
  if (Math.abs(deltaX) > 50 || Math.abs(deltaX) < -50) {
    let length = 1;
    if(number.value.indexOf(',')) {
      const numberArray = number.value.split('')
      if(numberArray[numberArray.length - 2] === ',') length = 2
    }
    number.value = number.value.length === 1 ? '0' : number.value.slice(0, number.value.length - length)
  }
}

// 监听 number 的变化来切换删除（AC/C）键，以及动态修改 number 的字体大小
watch(number, (currentNumber, prevNumber) => {
  if (prevNumber === '0' && !['0', '-0'].includes(currentNumber)) calculatorLists.value[0] = deletePrev;
  if (prevNumber !== '0' && currentNumber === '0' && calculatorNumber.value.length === 0) calculatorLists.value[0] = deleteAll;
  if(currentNumber.length > 9 && currentNumber.length < 11) fontSize.value = '120rpx';
  else if(currentNumber.length >= 11) fontSize.value = '100rpx';
  else fontSize.value = '140rpx';
})
</script>

<style lang="scss">
.content {
  background-color: #000;
  // height: 100vh;
  position: relative;
  padding-bottom: constant(safe-area-inset-bottom) !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
}

.result {
  // height: calc(100vh - 940rpx);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 20px;
}

.number {
  font-size: 120rpx;
  color: #fff;
}

.calculator {
  display: flex;
  width: 100%;
  /* justify-content: space-around; */
  flex-wrap: wrap;
  position: absolute;
  bottom: constant(safe-area-inset-bottom) !important;
  bottom: env(safe-area-inset-bottom) !important;
}

.item {
  width: 23%;
  margin: 0 1% 10px 1%;
  border-radius: 50%;
  font-size: 60rpx;
  color: #fff;
  text-align: center;
  background-color: #333;
  transition: opacity 0.2s;

  &:nth-child(-n + 3) {
    background-color: #a5a5a5;
    font-size: 50rpx;
    color: #000;
  }

  &:nth-child(4n) {
    font-size: 80rpx;
    background-color: #fea00c;
  }

  &:nth-child(17) {
    width: 48%;
    border-radius: 160rpx;
  }

  &:active {
    opacity: 0.5;
  }
}</style>
