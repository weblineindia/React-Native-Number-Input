import React, { PureComponent } from 'react';
import { TextInput } from 'react-native';
import { code } from 'currency-codes';

// Polyfill for Intl until properly supported in Android
import 'intl';
import 'intl/locale-data/jsonp/en';

type NumericTextInputType = "currency" | "decimal";

type NumericTextInputOptionsType = {
  currency?: string,
  decimalPlaces?: number,
  useGrouping?: boolean,
};

type Props = NumericTextInputOptionsType & {
  locale?: string,
  onUpdate: (value: ?number) => mixed,
  type?: NumericTextInputType,
  value?: number,
};

type NumberFormatConfig = {
  divisor: number,
  type: NumericTextInputType,
  locale: string,
  minimumFractionDigits: number,
};

class NumberTextInput extends PureComponent<Props> {
  formatConfig: NumberFormatConfig;

  constructor(props) {
    super(props);
    this.state = {
      onFocus: false
    }

    this.formatConfig = this.createFormatConfig(props);
    this.onFocus = this.onFocusMethod.bind(this);
    this.onBlur = this.onBlurMethod.bind(this);

  }

  createFormatConfig(props) {
    const { locale = 'de-DE', type = 'decimal', useGrouping = true } = props;
    const typeOptions = {};
    let { decimalPlaces = 0 } = props;

    if (type === 'currency') {
      const { currency = 'EUR' } = props;
      typeOptions.currency = currency;
      decimalPlaces = code(currency).digits;
    } else {
      typeOptions.minimumFractionDigits = decimalPlaces;
    }

    return Object.assign({}, typeOptions, {
      locale,
      style: type,
      useGrouping,
      divisor: Math.pow(10, decimalPlaces),
    });
  };


  formatNumberValue(numberValue, numberFormatConfig) {

    let returnValue = '';

    if (this.state.onFocus) {
      if (numberValue) {
        returnValue = numberValue.toString()
        return returnValue
      }
    } else {
      if (numberValue) {
        const { locale, ...config } = numberFormatConfig;
        returnValue = new Intl.NumberFormat(locale, config).format(numberValue);
      }

      if (this.props.prefix && this.props.postfix && numberValue) {
        return this.props.prefix + returnValue + this.props.postfix
      } else if (this.props.prefix && numberValue) {
        return this.props.prefix + returnValue
      } else if (this.props.postfix && numberValue) {
        return returnValue + this.props.postfix
      } else {
        return returnValue;
      }
    }
  }

  removeNegationValue(value) {
    const { allowNegative } = this.props;
    let number = (value.match(/\d+/g) || []).join('');
    const negationRegex = new RegExp('(-)');
    const doubleNegationRegex = new RegExp('(-)(.)*(-)');
    const hasNegation = negationRegex.test(value);
    const removeNegation = doubleNegationRegex.test(value);
    number = number.replace(/-/g, '');

    if (hasNegation && !removeNegation && allowNegative) {
      number = '-' + number;
    }
    return number
  }

  parseStringValue(value, numberFormatConfig) {
    return value
      ? parseInt(value) / numberFormatConfig.divisor
      : undefined;
  }

  onUpdate = (text) => {
    const { onUpdate } = this.props;
    let parsedValue;
    let formatedString = this.removeNegationValue(text);
    parsedValue = this.parseStringValue(formatedString, this.formatConfig);

    if (onUpdate) {
      onUpdate(parsedValue);
    }

  };

  onFocusMethod = (e) => {
    this.setState({ onFocus: true }, () => {
      if (this.props.onFocus) {
        this.props.onFocus(e)
      }
    })
  }

  onBlurMethod = (e) => {
    this.setState({ onFocus: false }, () => {
      if (this.props.onBlur) {
        this.props.onBlur(e)
      }
    })
  }

  render() {
    const { onUpdate, value, ...textInputProps } = this.props;
    return (
      <TextInput
        {...textInputProps}
        value={this.formatNumberValue(this.props.value, this.formatConfig)}
        keyboardType="numeric"
        returnKeyType={this.props.returnKeyType || 'done'}
        onChangeText={this.onUpdate}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      />
    );
  }
}

export default NumberTextInput;
