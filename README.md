# Simple Carousel

A super easy to use carousel react component. supports infinite sliding.

	import SimpleCarousel from './SimpleCarousel.jsx';

	var MySlider = (props) => {
        var settings = {infinite: !!props.infinite};
        var items = [1,2,3];
	    return (<SimpleCarousel {...settings}>
                {items.map((i,j) => (<div key={j}>i</div>))} 
	            </SimpleCarousel>);
    };


## props

- **infinite**: boolean, default `true`
- **dots**: boolean, default `true`, whether show dots or not.

