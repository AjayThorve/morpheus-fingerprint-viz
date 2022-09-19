import {
  DataFrame,
  IndexType,
  Series,
  Uint32,
  Float32,
  Uint32Series,
} from "@rapidsai/cudf";
const D3Node = require("d3-node");
const d3 = new D3Node().d3; // initializes D3 with container element

function hexToRgb(rgb) {
  var result = d3.color(rgb);
  return result
    ? {
        r: result.r / 255,
        g: result.g / 255,
        b: result.b / 255,
      }
    : null;
}

export function mapValuesToColorSeries(
  values,
  domain,
  colors_,
  nullColor = { r: 33, g: 33, b: 33 }
) {
  // validate colors and domain lengths
  if (colors_.length < 1 || domain.length < 1) {
    throw new Error("colors and domain must be arrays of length 1 or greater");
  }
  const colors = d3
    .scaleSequential()
    .interpolator(d3.interpolateRgb(colors_[0], colors_[1]))
    .domain([domain[0] * 100, domain[1] * 100]);

  const color_r = Series.sequence({
    step: 0,
    init: nullColor.r / 255,
    type: new Float32(),
    size: values.length,
  });
  const color_g = Series.sequence({
    step: 0,
    init: nullColor.g / 255,
    type: new Float32(),
    size: values.length,
  });
  const color_b = Series.sequence({
    step: 0,
    init: nullColor.b / 255,
    type: new Float32(),
    size: values.length,
  });

  const colorIndices = Series.sequence({
    type: new Uint32(),
    init: 0,
    step: 1,
    size: values.length,
  });

  if (domain.length == 1) {
    const boolMask = values.ge(domain[0]);
    const indices = colorIndices.filter(boolMask);
    const color = hexToRgb(colors(domain[0] * 100));
    color_r.setValues(indices, color.r);
    color_g.setValues(indices, color.g);
    color_b.setValues(indices, color.b);
  } else {
    for (let i = domain[0]; i < domain[1]; i += domain[2]) {
      const boolMask = values.ge(i);
      const indices = colorIndices.filter(boolMask);
      const color = hexToRgb(colors(i * 100));
      color_r.setValues(indices, color.r);
      color_g.setValues(indices, color.g);
      color_b.setValues(indices, color.b);
    }
  }
  // handle nulls
  if (values.countNonNulls() !== values.length) {
    // contains null values
    const indices = colorIndices.filter(values.isNull());
    color_r.setValues(indices, nullColor.r / 255);
    color_g.setValues(indices, nullColor.g / 255);
    color_b.setValues(indices, nullColor.b / 255);
  }

  return { color_r, color_g, color_b };
}
