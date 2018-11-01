/**
 * Created by dungtran on 8/20/17.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Text,
  Animated
} from "react-native";
import zxcvbn from "zxcvbn";
import _ from "lodash";

const { width: wWidth } = Dimensions.get("window");

const widthByPercent = (percentage, containerWidth = wWidth) => {
  const value = (percentage * containerWidth) / 100;
  return Math.round(value);
};

const regex = {
  digitsPattern: /\d/,
  lettersPattern: /[a-zA-Z]/,
  lowerCasePattern: /[a-z]/,
  upperCasePattern: /[A-Z]/,
  wordsPattern: /\w/,
  symbolsPattern: /\W/
};

export default class PasswordStrengthChecker extends Component {
  static defaultProps = {
    minLevel: 1,
    minLength: 0,
    ruleNames: "lowerCase|upperCase|digits|symbols",
    strengthLevels: [
      {
        label: "Weak",
        labelColor: "#fe6c6c",
        widthPercent: 33,
        innerBarColor: "#fe6c6c"
      },
      {
        label: "Fair",
        labelColor: "#feb466",
        widthPercent: 67,
        innerBarColor: "#feb466"
      },
      {
        label: "Fair",
        labelColor: "#feb466",
        widthPercent: 67,
        innerBarColor: "#feb466"
      },
      {
        label: "Strong",
        labelColor: "#6cfeb5",
        widthPercent: 100,
        innerBarColor: "#6cfeb5"
      }
    ],
    tooShort: {
      enabled: true,
      labelColor: "#ccc",
      label: "Too short",
      widthPercent: 33,
      innerBarColor: "#fe6c6c"
    },
    barColor: "#ffffff",
    barWidthPercent: 70,
    showBarOnEmpty: true
  };

  static propTypes = {
    value: PropTypes.string,
    minLength: PropTypes.number,
    ruleNames: PropTypes.string,
    strengthLevels: PropTypes.array,
    tooShort: PropTypes.object,
    minLevel: PropTypes.number,
    strengthWrapperStyle: View.propTypes.style,
    strengthBarStyle: View.propTypes.style,
    innerStrengthBarStyle: View.propTypes.style,
    strengthDescriptionStyle: Text.propTypes.style,
    barColor: PropTypes.string,
    barWidthPercent: PropTypes.number,
    showBarOnEmpty: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.animatedInnerBarWidth = new Animated.Value(0);
    this.animatedBarWidth = new Animated.Value(0);
    this.state = {
      level: -1,
      isTooShort: false
    };
  }

  componentDidMount() {
    const { showBarOnEmpty } = this.props;
    if (showBarOnEmpty) {
      this.showFullBar();
    }
  }

  showFullBar(isShow = true) {
    const { barWidthPercent } = this.props;
    const barWidth = isShow ? widthByPercent(barWidthPercent) : 0;
    Animated.timing(this.animatedBarWidth, {
      toValue: barWidth,
      duration: 20
    }).start();
  }

  isTooShort(password) {
    const { minLength } = this.props;
    if (!minLength) {
      return true;
    }
    return password.length < minLength;
  }

  isMatchingRules(password) {
    const { ruleNames } = this.props;
    if (!ruleNames) {
      return true;
    }

    const rules = _.chain(ruleNames)
      .split("|")
      .filter(rule => !!rule)
      .map(rule => rule.trim())
      .value();

    for (const rule of rules) {
      if (!this.isMatchingRule(password, rule)) {
        return false;
      }
    }
    return true;
  }

  isMatchingRule(password, rule) {
    switch (rule) {
      case "symbols":
        return regex.symbolsPattern.test(password);
      case "words":
        return regex.wordsPattern.test(password);
      case "digits":
        return regex.digitsPattern.test(password);
      case "letters":
        return regex.lettersPattern.test(password);
      case "lowerCase":
        return regex.lowerCasePattern.test(password);

      case "upperCase":
        return regex.upperCasePattern.test(password);
      default:
        return true;
    }
  }

  componentWillReceiveProps(nextprops) {
    console.log(nextprops);
    const level = this.getPasswordStrengthLevel(nextprops.value);
    this.setState({
      level: level
    });
  }

  calculateScore(text) {
    if (!text) {
      this.setState({
        isTooShort: false
      });
      return -1;
    }

    if (this.isTooShort(text)) {
      this.setState({
        isTooShort: true
      });
      return 0;
    }

    this.setState({
      isTooShort: false
    });

    if (!this.isMatchingRules(text)) {
      return 0;
    }

    return zxcvbn(text).score;
  }

  getPasswordStrengthLevel(password) {
    return this.calculateScore(password);
  }

  renderPasswordStrength() {
    const {
      barWidthPercent,
      tooShort,
      value,
      strengthLevels,
      barColor,
      strengthWrapperStyle,
      strengthBarStyle,
      innerStrengthBarStyle,
      strengthDescriptionStyle,
      showBarOnEmpty
    } = this.props;

    const barWidth = widthByPercent(barWidthPercent);

    const { level } = this.state;

    let strengthLevelBarStyle = {},
      strengthLevelLabelStyle = {},
      strengthLevelLabel = "",
      innerBarWidth = 0;
    if (level !== -1) {
      if (!showBarOnEmpty) {
        this.showFullBar();
      }

      innerBarWidth = widthByPercent(
        strengthLevels[level].widthPercent,
        barWidth
      );
      strengthLevelBarStyle = {
        backgroundColor: strengthLevels[level].innerBarColor
      };

      strengthLevelLabelStyle = {
        color: strengthLevels[level].labelColor
      };
      strengthLevelLabel = strengthLevels[level].label;

      if (tooShort.enabled && this.state.isTooShort) {
        innerBarWidth =
          widthByPercent(tooShort.widthPercent, barWidth) ||
          widthByPercent(strengthLevels[level].widthPercent, barWidth);
        strengthLevelBarStyle = {
          backgroundColor:
            tooShort.innerBarColor || strengthLevels[level].innerBarColor
        };
        strengthLevelLabelStyle = {
          color: tooShort.labelColor || strengthLevels[level].labelColor
        };
        strengthLevelLabel = tooShort.label || strengthLevels[level].label;
      }
    } else {
      if (!showBarOnEmpty) {
        this.showFullBar(false);
      }
    }

    Animated.timing(this.animatedInnerBarWidth, {
      toValue: innerBarWidth,
      duration: 800
    }).start();

    return (
      <View style={[styles.passwordStrengthWrapper, strengthWrapperStyle]}>
        <Animated.View
          style={[
            styles.passwordStrengthBar,
            strengthBarStyle,
            { backgroundColor: barColor, width: this.animatedBarWidth }
          ]}>
          <Animated.View
            style={[
              styles.innerPasswordStrengthBar,
              innerStrengthBarStyle,
              { ...strengthLevelBarStyle, width: this.animatedInnerBarWidth }
            ]}
          />
        </Animated.View>
        <Text
          style={[
            styles.strengthDescription,
            strengthDescriptionStyle,
            { ...strengthLevelLabelStyle }
          ]}>
          {strengthLevelLabel}
        </Text>
      </View>
    );
  }

  render() {
    return <View style={styles.wrapper}>{this.renderPasswordStrength()}</View>;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent"
  },
  passwordStrengthWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10
  },
  passwordStrengthBar: {
    height: 10,
    position: "relative",
    top: 5,
    bottom: 5,
    borderRadius: 5
  },
  innerPasswordStrengthBar: {
    height: 10,
    borderRadius: 5,
    width: 0
  },
  strengthDescription: {
    color: "#ccc",
    backgroundColor: "transparent",
    textAlign: "right",
    position: "absolute",
    right: 5,
    top: 15,
    fontSize: 14
  }
});
