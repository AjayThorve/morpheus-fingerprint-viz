import {DataFrame, IndexType, Series, Uint32, Float32, Uint32Series} from '@rapidsai/cudf';

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16)/255,
      g: parseInt(result[2], 16)/255,
      b: parseInt(result[3], 16)/255
    } : null;
  }
  

export function mapValuesToColorSeries(
    values,
    domain,
    colors,
    nullColor = {r:255, g:192, b:203}){
    // validate colors and domain lengths
    if (colors.length < 1 || domain.length < 1) {
      throw new Error('colors and domain must be arrays of length 1 or greater');
    }


    const color_r = Series.sequence({step:0, init: 1, type: new Float32, size: values.length});
    const color_g = Series.sequence({step:0, init: 1, type: new Float32, size: values.length});
    const color_b = Series.sequence({step:0, init: 1, type: new Float32, size: values.length});
  
    const colorIndices = Series.sequence({type: new Uint32, init: 0, step: 1, size: values.length});
  
    if (domain.length == 1) {
        const boolMask = values.ge(domain[0]);
        const indices  = colorIndices.filter(boolMask);
        const color = hexToRgb(colors[0] || colors[colors.length - 1]);
        color_r.setValues(indices, color.r);
        color_g.setValues(indices, color.g);
        color_b.setValues(indices, color.b);
    } else {
      for (let i = 0; i < domain.length - 1; i++) {
        const boolMask = values.ge(domain[i]).logicalAnd(values.lt(domain[i + 1]));
        const indices  = colorIndices.filter(boolMask);
        const color = hexToRgb(colors[i] || colors[colors.length - 1]);
        color_r.setValues(indices, color.r);
        color_g.setValues(indices, color.g);
        color_b.setValues(indices, color.b);
      }
    }
    // handle nulls
    if (values.countNonNulls() !== values.length) {  // contains null values
        const indices = colorIndices.filter(values.isNull());
        color_r.setValues(indices, nullColor.r/255);
        color_g.setValues(indices, nullColor.g/255);
        color_b.setValues(indices, nullColor.b/255);
    }
    
    return {color_r, color_g, color_b};
  }