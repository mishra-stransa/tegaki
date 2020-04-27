import React from 'react';
import './App.css';
import firebase from 'firebase';

class DrawArea extends React.Component {
    constructor() {
    super();
    
    this.state = {
      isDrawing: false,
      points: [],
      stroke: '#000',
      strokeWidth: 5, 
      toSend: [],
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
    this.loadData();
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  loadData = () => {
    firebase.database().ref("points").on("value", snapshot => {
      this.setState({points: !snapshot.val()? [] : snapshot.val()})
    })
  }

  handleMouseDown(mouseEvent) {
    mouseEvent.preventDefault();

    const [orignalCoords] = this.relativeCoordinatesForEvent(mouseEvent);
    const {points} = this.state;

    points.push({
      stroke: this.state.stroke,
      strokeWidth: this.state.strokeWidth,
      data: [orignalCoords],
    })

    this.setState({
      points,
      isDrawing: true,
    })
  }

  handleMouseMove(mouseEvent) {
    if (!this.state.isDrawing) {
      return;
    }

    mouseEvent.preventDefault();

    const [orignalCoords] = this.relativeCoordinatesForEvent(mouseEvent);
    const {points} = this.state;
    
    points[points.length - 1].data.push(orignalCoords);

    this.setState({
      points,
    })
  }

  handleMouseUp(e) {
    e && e.preventDefault()
    this.setState({ isDrawing: false });
    firebase.database().ref("points").set({
      ...this.state.points
    })
  }

  onUndo = () => {
    this.setState({
      points: this.state.points.slice(0, this.state.points.length - 1),
    }, () => {
      firebase.database().ref("points").set({
        ...this.state.points
      })
    })
  }

  clearAll = () => {
    this.setState({
      points: [],
    }, () => {
      firebase.database().ref("points").set({
        ...this.state.points
      })
    })
  }

  relativeCoordinatesForEvent(mouseEvent) {
    const boundingRect = this.refs.drawArea.getBoundingClientRect();
    let x = mouseEvent.type.includes('touch') ? mouseEvent.touches[0].clientX : mouseEvent.clientX
    let y = mouseEvent.type.includes('touch') ? mouseEvent.touches[0].clientY : mouseEvent.clientY
    return [{
      x: x - boundingRect.left,
      y: y - boundingRect.top,
    }]
  }

  render() {
    return (
      <>
        <div
          className="drawArea"
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onTouchStart={(e) => this.handleMouseDown(e)}
          onTouchMove={this.handleMouseMove}
          onTouchEnd={this.handleMouseUp}
        >
          <Drawing points={this.state.points} />
        </div>
        <div className="config">
          <div className="color-pickers">
            <div className="color-pickers-box" onClick={() => this.setState({stroke: '#000'})} style={{ background: '#000' }} />
            <div className="color-pickers-box" onClick={() => this.setState({stroke: 'red'})} style={{ background: 'red' }} />
            <div className="color-pickers-box" onClick={() => this.setState({stroke: 'blue'})} style={{ background: 'blue' }} />
          </div>
          <input className="stroke-width" value={this.state.strokeWidth} type="number" onChange={(e) => this.setState({strokeWidth: parseInt(e.target.value)})} />
          <button onClick={this.onUndo}>Undo</button>
          <button onClick={this.clearAll}>Clear All</button>
        </div>
      </>
    );
  }
}

function Drawing({ points }) {
  return (
    <svg className="drawing">
      <image x={0} y={0} xlinkHref={"https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Cephalometric_radiograph.JPG/600px-Cephalometric_radiograph.JPG"} height={400} width={400} />
      {points.map((line, index) => {
       return <DrawingLine key={index} line={line.data} stroke={line.stroke} strokeWidth={line.strokeWidth} />
      })}
    </svg>
  );
}

function DrawingLine({ line, ...rest }) {
  const pathData = "M " +
    line
      .map(p => {
        return `${p.x} ${p.y}`;
      })
      .join(" L ");

  return <path {...rest} className="path" d={pathData} />;
}

export default DrawArea;