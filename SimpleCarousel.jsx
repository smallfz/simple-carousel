/* -*- coding: utf-8 -*- */

require('./SimpleCarousel.css');

class SimpleCarousel extends React.Component{

    constructor(props){
        super(props);
        this._touchStart = this._touchStart.bind(this);
        this._touchMove = this._touchMove.bind(this);
        this._touchEnd = this._touchEnd.bind(this);
        this._playOneStep = this._playOneStep.bind(this);
        this._moveLeftOneStepNow = this._moveLeftOneStepNow.bind(this);
        this._prevPoint = null;
        this._div = null;
        this._size = null;
        this._position = {x: 0, y: 0};
        this._pageCount = 0;
        this._t = null;
        this._currentPlayInterval = -1;
    }

    componentDidMount(){
        this.init();
        this.update();
    }

    componentDidUpdate(){
        this.update();
    }

    componentWillUnmount(){
        this.cleanUp();
    }

    _getDiv(){
        var div = ReactDOM.findDOMNode(this);
        return div;
    }

    cleanUp(){
        this._stopAutoPlay();
        var div = this._getDiv();
        if(!div){ return; }
        div.removeEventListener('touchstart', this._touchStart);
        div.removeEventListener('touchmove', this._touchMove);
        div.removeEventListener('touchend', this._touchEnd);
        div.removeEventListener('touchcancel', this._touchEnd);
        this._div = null;
    }

    init(){
        var div = this._getDiv();
        if(!div){ return; }
        this._div = div;
        this._size = {w: div.offsetWidth, h: div.offsetHeight};
        div.addEventListener('touchstart', this._touchStart);
        div.addEventListener('touchmove', this._touchMove);
        div.addEventListener('touchend', this._touchEnd);
        div.addEventListener('touchcancel', this._touchEnd);
    }
    
    update(){
        this._updateBoxesPosition();
        this._updateDots();
        var {autoPlay, autoPlayInterval, infinite} = this.props;
        autoPlay = autoPlay && infinite;
        if(!autoPlay || this._currentPlayInterval != autoPlayInterval){
            this._stopAutoPlay();
            if(autoPlay){
                this._startAutoPlay();
            }
        }
    }

    _stopAutoPlay(){
        if(this._t){
            clearInterval(this._t);
            this._t = null;
        }
    }

    _startAutoPlay(){
        var {autoPlayInterval} = this.props;
        if(autoPlayInterval > 0){
            this._t = setInterval(this._playOneStep, autoPlayInterval);
            this._currentPlayInterval = autoPlayInterval;
        }
    }

    _playOneStep(){
        if(this._rearrangeBoxes()){
            this._updateBoxesPosition();
        }
        setTimeout(this._moveLeftOneStepNow, 1);
    }

    _moveLeftOneStepNow(){
        var w = this._size.w;
        this._position.x -= w;
        this._updateBoxesPosition('full');
        this._updateDots();
    }

    _updateDots(){
        var div = this._div;
        var w = this._size.w;
        var dots = div.querySelectorAll('.dots .dot');
        if(!dots || dots.length <= 0){ return; }
        var p = parseInt(Math.round(-this._position.x / w));
        while(p < 0){ p += dots.length; }
        var i = p % dots.length;
        for(var _i=0;_i<dots.length;_i++){
            var hl = _i == i;
            var d = dots[_i];
            d.className = hl ? 'dot hl' : 'dot';
        }
    }

    _updateBoxesPosition(aniName){
        var div = this._div;
        var w = this._size.w;
        var boxes = div.querySelectorAll('.page-box');
        this._pageCount = boxes ? boxes.length : 0;
        if(!boxes || boxes.length < 3){ return; }
        var pos = this._position;
        for(var _i=0;_i<boxes.length;_i++){
            var b = boxes[_i];
            var i = parseInt(b.getAttribute('x-index'));
            if(isNaN(i)){
                i = _i;
            }
            var x = i * w + pos.x;
            var transform = `translate(${x}px, 0px)`;
            // var color = parseInt(256 * (_i + 0.35) / boxes.length);
            b.style.width = w + 'px';
            // b.style.backgroundColor = `hsl(${color}, 90%, 75%)`;
            b.style.transform = transform;
            b.style['-webkit-transform'] = transform;
            var c = b.className.replace(/\s+ani\-\w+/i, '');
            b.className = aniName ? c+' ani-'+aniName : c;
        }
    }

    _rearrangeBoxes(){
        // todo: play a hat trick ...
        var x = this._position.x;
        var w = this._size.w;
        var p = -1 * parseInt(Math.round(x / w));
        //
        var div = this._div;
        var boxes = div.querySelectorAll('.page-box');
        if(!boxes || boxes.length <= 0){ return; }
        var left = null, right = null;
        var _min = [Infinity, null], _max = [-Infinity, null];
        for(var _i=0;_i<boxes.length;_i++){
            var b = boxes[_i];
            var i = parseInt(b.getAttribute('x-index'));
            if(isNaN(i)){
                b.setAttribute('x-index', _i);
                i = _i;
            }
            if(i == p-1){
                left = b;
            }else if(i == p+1){
                right = b;
            }
            if(_min[0] > i){
                _min[0] = i;
                _min[1] = b;
            }
            if(_max[0] < i){
                _max[0] = i;
                _max[1] = b;
            }
        }
        if(!left){
            _max[1].setAttribute('x-index', p-1);
        }
        if(!right){
            _min[1].setAttribute('x-index', p+1);
        }
        _min.length = 0;
        _max.length = 0;
        return !left || !right;
    }

    _touchStart(e){
        var {infinite} = this.props;
        var t = e.touches[0];
        this._prevPoint = {x: t.clientX, y: t.clientY};
        this._stopAutoPlay();
        if(infinite){
            if(this._rearrangeBoxes()){
                this._updateBoxesPosition();
            }
        }
    }

    _touchMove(e){
        if(!this._prevPoint){
            return; 
        }
        var t = e.touches[0];
        var offsetX = t.clientX - this._prevPoint.x;
        this._position.x += offsetX;
        this._prevPoint.x = t.clientX;
        this._prevPoint.y = t.clientY;
        if(offsetX != 0){
            this._updateBoxesPosition();
        }
    }

    _touchEnd(e){
        var {infinite, autoPlay} = this.props;
        this._prevPoint = null;
        var w = this._size.w;
        var stepOffset = this._position.x % w;
        var dir = stepOffset / Math.abs(stepOffset);
        var x = this._position.x - stepOffset;
        if(Math.abs(stepOffset) > w/2){
            x += dir * w;
        }
        if(!infinite){
            if(x > 0){
                x = 0;
            }else if(x < -1 * (this._pageCount -1) * w){
                x = -1 * (this._pageCount - 1) * w;
            }
        }
        this._position.x = x;
        this._updateBoxesPosition('half');
        this._updateDots();
        if(autoPlay){
            // reset autoplay state
            this._stopAutoPlay();
            this._startAutoPlay();
        }
    }

    render(){
        var {dots} = this.props;
        var items = this.props.children || [];
        if(items.length < 3 && items.length > 0){
            if(items.length < 2){
                items.push(items[0]);
            }
            if(items.length < 3){
                items.push(items[1]);
            }
        }
        return (<div className='simple-carousel'>
                <div className='pages'>
                {items.map((item, i) => {
                    return (<div className='page-box' key={i}>
                            {item}
                            </div>);
                })}
                </div>
                {dots
                 ? (<div className='dots'>
                    {items.map((item, i) => {
                        return (<span className='dot' key={i}></span>); 
                    })}
                    </div>)
                 : null}
                </div>);
    }

}

SimpleCarousel.defaultProps = {
    infinite: true,
    dots: true,
    autoPlay: true,
    autoPlayInterval: 5000
};

module.exports = SimpleCarousel;
