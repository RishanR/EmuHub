//Module from react-swipeable-views by oliviertassinari
import React from 'react';
import PropTypes from 'prop-types';

class PaginationDot extends React.Component {
  handleClick = (event) => {
    this.props.onClick(event, this.props.index);
  };

  render() {
    const styles = {
      root: {
        height: window.innerHeight * 0.02,
        width: window.innerHeight * 0.02,
        cursor: 'pointer',
        border: 0,
        background: 'none',
        padding: 0,
      },
      dot: {
        backgroundColor: '#ffffff41',
        height: window.innerHeight * 0.015,
        width: window.innerHeight * 0.015,
        borderRadius: window.innerHeight * 0.0075,
      },
      active: {
        backgroundColor: '#ecf0f1',
        transform: 'scale(1.2)',
      },
    };
    const { active } = this.props;

    let styleDot;

    if (active) {
      styleDot = Object.assign({}, styles.dot, styles.active);
    } else {
      styleDot = styles.dot;
    }

    return (
      <button type="button" style={styles.root} onClick={this.handleClick}>
        <div style={styleDot} />
      </button>
    );
  }
}

PaginationDot.propTypes = {
  active: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default PaginationDot;
