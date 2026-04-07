/* eslint-disable prettier/prettier */

import { Svg, G, Path, Line, Circle, Rect, Text } from 'react-native-svg';
import { PathLine } from './mapRenderers';
import React from 'react';
import nodesData from './f1nodes.json';

import PathfinderController from '../../backend/PathfinderController';

const MapSVG = ({
  selectedItem,
  selectedProductId, // new prop
  startNodeId,
  onStartPointPress, // callback for start point tap
  path = [],
  width,
  height,
  renderScale = 1,
  zoomScale = 1,
  pinpointMode = false,
  onPinpointTap,
}) => {
  const nodes = nodesData.nodes;
  // Instantiate controller once
  const pathfinder = React.useMemo(() => new PathfinderController(), []);


  // Track visited stalls (for navigation logic)
  const [visitedStalls, setVisitedStalls] = React.useState([]); // array of stall IDs

  // Keep the SVG dimensions in sync with the container to avoid oversized paper geometry
  const svgWidth = width;
  const svgHeight = height;
  const boundaryStrokeWidth = zoomScale >= 2 ? 1.5 : 2;

  // Force auxiliary details to always render (no zoom threshold gating)
  const showAuxiliaryDetails = true;

  // Get stall IDs to highlight (product or stall)
  const normalizedProductId = selectedProductId && selectedProductId.replace(/^pp/, 'p');
  const highlightedStalls = React.useMemo(() => {
    if (!normalizedProductId) return [];
    const stalls = pathfinder.getStallsToHighlight(normalizedProductId);
    console.log('[MapSVG] selectedProductId:', normalizedProductId, 'highlightedStalls:', stalls);
    return stalls;
  }, [normalizedProductId, pathfinder]);

  // Log grouped stall_endNodes of highlighted stalls on mount and whenever selectedProductId or visitedStalls changes
  React.useEffect(() => {
    if (!selectedProductId) return;
    // Convert visitedStalls array to Set for fast lookup
    const visitedSet = new Set(visitedStalls);
    // Group stall_endNodes for each highlighted stall (excluding visited)
    const grouped = highlightedStalls
      .filter(stallId => !visitedSet.has(String(stallId)))
      .map(stallId => {
        const stallData = pathfinder.saveData.stalls[String(stallId)];
        return {
          stallId: String(stallId),
          stall_endNodes: stallData && Array.isArray(stallData.stall_endNode) ? stallData.stall_endNode : []
        };
      });
    console.log('[MapSVG] grouped stall_endNodes per stall (excluding visited):', grouped);
  }, [selectedProductId, pathfinder, visitedStalls, highlightedStalls]);

  // getNodeFill: highlight stalls to be highlighted in green, fallback to default color
  const getNodeFill = (id) => {
    if (highlightedStalls.includes(String(id))) {
      return '#609966';
    }
    return '#D9D9D9'; // fallback/default color
  };

  // Helper to render a tappable StartPoint with a star inside
  const RenderStartPoint = ({ id, cx, cy, isSelected }) => {
    // Smaller star for better selection visibility
    const starScale = 1.0; // reduce from 1.4 to 1.0
    const starPoints = [
      [0, -10],
      [2.94, -3.09],
      [9.51, -3.09],
      [4.05, 1.18],
      [5.88, 8.09],
      [0, 4],
      [-5.88, 8.09],
      [-4.05, 1.18],
      [-9.51, -3.09],
      [-2.94, -3.09],
    ];
    const starPath =
      'M ' +
      starPoints
        .map(([x, y]) => `${cx + x * starScale},${cy + y * starScale}`)
        .join(' L ') +
      ' Z';
    const blue = '#0059FF';
    const white = '#fff';
    return (
      <G>
        {/* Circle outline and fill */}
        <Circle
          cx={cx}
          cy={cy}
          r={18}
          fill={isSelected ? blue : white}
          stroke={blue}
          strokeWidth={isSelected ? 4 : 2}
          onPress={() => onStartPointPress && onStartPointPress(id)}
          pointerEvents="auto"
        />
        {/* Star shape always filled white */}
        <Path
          d={starPath}
          fill={white}
          stroke="none"
          pointerEvents="none"
        />
      </G>
    );
  };

  // Handler for tap events in pinpoint mode
  const handleMapPress = (event) => {
    if (!pinpointMode || !onPinpointTap) return;
    const { locationX, locationY } = event.nativeEvent;
    // SVG viewBox: 2022 x 629 (landscape)
    // Container: width x height (could be portrait)
    // Calculate scale and letterboxing
    const viewBoxWidth = 2022;
    const viewBoxHeight = 629;
    const containerWidth = width;
    const containerHeight = height;
    // Calculate scale to fit SVG inside container (contain, not cover)
    const scale = Math.min(
      containerWidth / viewBoxWidth,
      containerHeight / viewBoxHeight
    );
    // Calculate actual rendered SVG size
    const renderedSVGWidth = viewBoxWidth * scale;
    const renderedSVGHeight = viewBoxHeight * scale;
    // Calculate letterbox offset (centered)
    const offsetX = (containerWidth - renderedSVGWidth) / 2;
    const offsetY = (containerHeight - renderedSVGHeight) / 2;
    // Only map taps inside the SVG area
    if (
      locationX < offsetX ||
      locationX > offsetX + renderedSVGWidth ||
      locationY < offsetY ||
      locationY > offsetY + renderedSVGHeight
    ) {
      // Tap is outside SVG area, ignore
      return;
    }
    // Convert locationX/Y to SVG coordinates
    const svgX = ((locationX - offsetX) / renderedSVGWidth) * viewBoxWidth;
    const svgY = ((locationY - offsetY) / renderedSVGHeight) * viewBoxHeight;
    onPinpointTap({ x: svgX, y: svgY });
  };

  // List of predefined start points
  const predefinedStartPoints = [
    { id: 221, cx: 650, cy: 604 },
    { id: 231, cx: 772, cy: 606 },
    { id: 71, cx: 1262, cy: 606 },
    { id: 70, cx: 1324, cy: 606 },
    { id: 2, cx: 2006, cy: 606 },
    { id: 106, cx: 2006, cy: 132 },
    { id: 138, cx: 1332, cy: 68 },
    { id: 137, cx: 1268, cy: 62 },
    { id: 175, cx: 696, cy: 50 },
    { id: 228, cx: 562, cy: 114 },
  ];

  // Check if current startNodeId is a predefined start point
  const isPredefinedStart = predefinedStartPoints.some(pt => String(pt.id) === String(startNodeId));
  // If not, get its coordinates from nodesData
  let customStartCoords = null;
  if (startNodeId && !isPredefinedStart && nodes[String(startNodeId)]) {
    const node = nodes[String(startNodeId)];
    customStartCoords = { cx: node.x, cy: node.y };
  }

  return (
    <Svg
      fill="none"
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 2022 629"
      preserveAspectRatio="xMidYMid meet"
      style={{ backgroundColor: "transparent", flex: 1 }}
      onPress={handleMapPress}
    >
<G id="Group 10">
<Path id="boundary" d="M663.924 571.569L613.967 578H427.703L407.392 558.184L137.817 128.362L579.587 50.0801L663.924 571.569Z" stroke="#646464" strokeWidth={boundaryStrokeWidth} fill="none" vectorEffect="non-scaling-stroke"/>
<Path id="boundary 2" d="M1279.96 47.9541L1272.5 129.955L1272.5 129.976V129.997L1269.5 629H766.426L666.572 10.9092L727.522 0.50293L1279.96 47.9541Z" stroke="#646464" strokeWidth={boundaryStrokeWidth} fill="none" vectorEffect="non-scaling-stroke"/>
<Path id="boundary 3" d="M2016 115.456V628.5H1316V132.529L1324.94 53.042L2016 115.456Z" stroke="#646464" strokeWidth={boundaryStrokeWidth} fill="none" vectorEffect="non-scaling-stroke"/>
<Path id="boundary 4" d="M673.409 625.982L383.514 618L383.473 617.999L383.433 618.005L324.741 625.963L0.771484 144.751L121.625 100.985L575.587 25.0752L673.409 625.982Z" stroke="#646464" strokeWidth={boundaryStrokeWidth} fill="none" vectorEffect="non-scaling-stroke"/>
<Rect id="1" x="1973" y="567.5" width="24" height="29" fill={getNodeFill('1')}/>
<Rect id="2" x="1973" y="537.5" width="24" height="28" fill={getNodeFill('2')}/>
<Rect id="3" x="1973" y="507.5" width="24" height="28" fill={getNodeFill('3')}/>
<Rect id="4" x="1947" y="567.5" width="24" height="29" fill={getNodeFill('4')}/>
<Rect id="5" x="1947" y="537.5" width="24" height="28" fill={getNodeFill('5')}/>
<Rect id="6" x="1947" y="479.5" width="24" height="56" fill={getNodeFill('6')}/>
<Rect id="7" x="1947" y="423.5" width="24" height="28" fill={getNodeFill('7')}/>
<Rect id="8" x="1973" y="428.5" width="24" height="23" fill={getNodeFill('8')}/>
<Rect id="9" x="1973" y="405.5" width="24" height="21" fill={getNodeFill('9')}/>
<Rect id="10" x="1947" y="394.5" width="24" height="27" fill={getNodeFill('10')}/>
<Rect id="11" x="1973" y="383.5" width="24" height="20" fill={getNodeFill('11')}/>
<Rect id="12" x="1947" y="368.5" width="24" height="24" fill={getNodeFill('12')}/>
<Rect id="13" x="1973" y="363.5" width="24" height="18" fill={getNodeFill('13')}/>
<Rect id="14" x="1947" y="341.5" width="24" height="25" fill={getNodeFill('14')}/>
<Rect id="15" x="1973" y="341.5" width="24" height="20" fill={getNodeFill('15')}/>
<Rect id="16" x="1947" y="316.5" width="50" height="23" fill={getNodeFill('16')}/>
<Rect id="17" x="1947" y="276.5" width="50" height="23" fill={getNodeFill('17')}/>
<Rect id="18" x="1947" y="252.5" width="50" height="22" fill={getNodeFill('18')}/>
<Rect id="19" x="1973" y="216.5" width="24" height="34" fill={getNodeFill('19')}/>
<Rect id="20" x="1947" y="212.5" width="24" height="38" fill={getNodeFill('20')}/>
<Rect id="21" x="1973" y="181.5" width="24" height="33" fill={getNodeFill('21')}/>
<Rect id="22" x="1947" y="171.5" width="24" height="39" fill={getNodeFill('22')}/>
<Rect id="23" x="1973" y="142.5" width="24" height="37" fill={getNodeFill('23')}/>
<Rect id="24" x="1905" y="546.5" width="24" height="50" fill={getNodeFill('24')}/>
<Rect id="25" x="1879" y="553.5" width="24" height="43" fill={getNodeFill('25')}/>
<Rect id="26" x="1879" y="517.5" width="24" height="34" fill={getNodeFill('26')}/>
<Rect id="27" x="1879" y="479.5" width="24" height="36" fill={getNodeFill('27')}/>
<Rect id="28" x="1905" y="479.5" width="24" height="41" fill={getNodeFill('28')}/>
<Rect id="29" x="1835" y="554.5" width="27" height="41" fill={getNodeFill('29')}/>
<Rect id="30" x="1809" y="554.5" width="24" height="41" fill={getNodeFill('30')}/>
<Rect id="31" x="1779" y="554.5" width="28" height="41" fill={getNodeFill('31')}/>
<Rect id="32" x="1809" y="507.5" width="54" height="45" fill={getNodeFill('32')}/>
<Rect id="33" x="1809" y="479.5" width="54" height="26" fill={getNodeFill('33')}/>
<Rect id="34" x="1779" y="479.5" width="28" height="43" fill={getNodeFill('34')}/>
<Rect id="35" x="1732" y="546.5" width="33" height="48" fill={getNodeFill('35')}/>
<Rect id="36" x="1698" y="546.5" width="32" height="48" fill={getNodeFill('36')}/>
<Rect id="37" x="1732" y="496.5" width="33" height="48" fill={getNodeFill('37')}/>
<Rect id="38" x="1698" y="496.5" width="32" height="48" fill={getNodeFill('38')}/>
<Rect id="39" x="1660" y="554.5" width="23" height="41" fill={getNodeFill('39')}/>
<Rect id="40" x="1638" y="554.5" width="20" height="41" fill={getNodeFill('40')}/>
<Rect id="41" x="1614" y="554.5" width="22" height="41" fill={getNodeFill('41')}/>
<Rect id="42" x="1651" y="519.5" width="32" height="33" fill={getNodeFill('42')}/>
<Rect id="43" x="1614" y="519.5" width="35" height="33" fill={getNodeFill('43')}/>
<Rect id="44" x="1614" y="496.5" width="69" height="21" fill={getNodeFill('44')}/>
<Rect id="45" x="1566" y="561.5" width="33" height="34" fill={getNodeFill('45')}/>
<Rect id="46" x="1531" y="546.5" width="33" height="49" fill={getNodeFill('46')}/>
<Rect id="47" x="1566" y="529.5" width="33" height="30" fill={getNodeFill('47')}/>
<Rect id="48" x="1566" y="495.5" width="33" height="32" fill={getNodeFill('48')}/>
<Rect id="49" x="1531" y="495.5" width="33" height="50" fill={getNodeFill('49')}/>
<Rect id="50" x="1490" y="562.5" width="28" height="32" fill={getNodeFill('50')}/>
<Rect id="51" x="1461" y="562.5" width="27" height="32" fill={getNodeFill('51')}/>
<Rect id="52" x="1431" y="562.5" width="28" height="32" fill={getNodeFill('52')}/>
<Rect id="53" x="1476" y="529.5" width="42" height="31" fill={getNodeFill('53')}/>
<Rect id="54" x="1431" y="529.5" width="43" height="31" fill={getNodeFill('54')}/>
<Rect id="55" x="1476" y="495.5" width="42" height="32" fill={getNodeFill('55')}/>
<Rect id="56" x="1431" y="495.5" width="43" height="32" fill={getNodeFill('56')}/>
<Rect id="57" x="1390" y="562.5" width="28" height="32" fill={getNodeFill('57')}/>
<Rect id="58" x="1361" y="529.5" width="57" height="65" fill={getNodeFill('58')}/>
<Rect id="59" x="1331" y="562.5" width="28" height="32" fill={getNodeFill('59')}/>
<Rect id="60" x="1331" y="496.5" width="28" height="64" fill={getNodeFill('60')}/>
<Rect id="61" x="1361" y="496.5" width="57" height="31" fill={getNodeFill('61')}/>
<Rect id="62" x="1906" y="430.5" width="24" height="21" fill={getNodeFill('62')}/>
<Rect id="64" x="1880" y="408.5" width="24" height="43" fill={getNodeFill('64')}/>
<Rect id="65" x="1906" y="385.5" width="24" height="43" fill={getNodeFill('65')}/>
<Rect id="66" x="1880" y="385.5" width="24" height="21" fill={getNodeFill('66')}/>
<Rect id="67" x="1906" y="362.5" width="24" height="21" fill={getNodeFill('67')}/>
<Rect id="68" x="1880" y="341.5" width="24" height="42" fill={getNodeFill('68')}/>
<Rect id="69" x="1906" y="318.5" width="24" height="42" fill={getNodeFill('69')}/>
<Rect id="70" x="1880" y="318.5" width="24" height="21" fill={getNodeFill('70')}/>
<Path id="71" d="M1910 274.5H1932V299.5H1910L1910 274.5Z" fill={getNodeFill('71')}/>
<Path id="72" d="M1879 274.5H1906V299.5H1879L1879 274.5Z" fill={getNodeFill('72')}/>
<Path id="73" d="M1910 246.5H1932V272.5H1910L1910 246.5Z" fill={getNodeFill('73')}/>
<Path id="74" d="M1879 246.5H1906V272.5H1879L1879 246.5Z" fill={getNodeFill('74')}/>
<Path id="75" d="M1910 219.5H1932V244.5H1910L1910 219.5Z" fill={getNodeFill('75')}/>
<Path id="76" d="M1879 219.5H1906V244.5H1879L1879 219.5Z" fill={getNodeFill('76')}/>
<Path id="77" d="M1910 191.5H1933V217.5H1910L1910 191.5Z" fill={getNodeFill('77')}/>
<Path id="78" d="M1880 191.5H1907V217.5H1880L1880 191.5Z" fill={getNodeFill('78')}/>
<Path id="79" d="M1910 165.5H1934V189.5H1910L1910 165.5Z" fill={getNodeFill('79')}/>
<Path id="80" d="M1881.93 165.5H1908V189.5H1880L1881.93 165.5Z" fill={getNodeFill('80')}/>
<Path id="81" d="M1910 137.5L1936 141.021L1934.21 162.5H1910L1910 137.5Z" fill={getNodeFill('81')}/>
<Path id="82" d="M1882 134.5H1894.5L1908 138V162.5H1882V134.5Z" fill={getNodeFill('82')}/>
<Rect id="83" x="1782" y="383.5" width="31" height="32" fill={getNodeFill('83')}/>
<Rect id="84" x="1746" y="383.5" width="34" height="32" fill={getNodeFill('84')}/>
<Rect id="85" x="1841" y="339.5" width="20" height="19" fill={getNodeFill('85')}/>
<Rect id="86" x="1819" y="339.5" width="20" height="19" fill={getNodeFill('86')}/>
<Rect id="87" x="1775" y="339.5" width="42" height="19" fill={getNodeFill('87')}/>
<Rect id="88" x="1731" y="339.5" width="42" height="19" fill={getNodeFill('88')}/>
<Rect id="89" x="1819" y="318.5" width="42" height="19" fill={getNodeFill('89')}/>
<Rect id="90" x="1797" y="318.5" width="20" height="19" fill={getNodeFill('90')}/>
<Rect id="91" x="1753" y="318.5" width="42" height="19" fill={getNodeFill('91')}/>
<Rect id="92" x="1731" y="318.5" width="20" height="19" fill={getNodeFill('92')}/>
<Path id="93" d="M1837 284.5H1861V296.5H1837V284.5Z" fill={getNodeFill('93')}/>
<Path id="94" d="M1837 270.5H1861V282.5H1837V270.5Z" fill={getNodeFill('94')}/>
<Path id="95" d="M1837 255.5H1861V269.5H1837V255.5Z" fill={getNodeFill('95')}/>
<Path id="96" d="M1837 242.5H1861V254.5H1837V242.5Z" fill={getNodeFill('96')}/>
<Path id="97" d="M1837 229.5H1861V240.5H1837V229.5Z" fill={getNodeFill('97')}/>
<Path id="98" d="M1808 229.5H1835V296.5H1808V229.5Z" fill={getNodeFill('98')}/>
<Path id="99" d="M1782 284.5H1807V296.5H1782V284.5Z" fill={getNodeFill('99')}/>
<Path id="100" d="M1757 284.5H1779V296.5H1757V284.5Z" fill={getNodeFill('100')}/>
<Path id="101" d="M1731 281.5H1755V296.5H1731V281.5Z" fill={getNodeFill('101')}/>
<Path id="102" d="M1731 262.5H1752V277.5H1731V262.5Z" fill={getNodeFill('102')}/>
<Path id="103" d="M1731 246.5H1752V261.5H1731V246.5Z" fill={getNodeFill('103')}/>
<Path id="104" d="M1731 228.5H1752V243.5H1731V228.5Z" fill={getNodeFill('104')}/>
<Path id="105" d="M1846 131.758L1867.5 132.5L1864 211.5H1846V131.758Z" fill={getNodeFill('105')}/>
<Path id="106" d="M1829 130.5L1845 131.5V167.5H1829V130.5Z" fill={getNodeFill('106')}/>
<Path id="107" d="M1810 129.5L1828 130V167.5H1810V129.5Z" fill={getNodeFill('107')}/>
<Path id="108" d="M1789 126.5L1808 129V167.5H1789V126.5Z" fill={getNodeFill('108')}/>
<Path id="109" d="M1769 124.5L1787 126.5V167.5H1769V124.5Z" fill={getNodeFill('109')}/>
<Path id="110" d="M1750 123.5L1767 124.5V167.5H1750V123.5Z" fill={getNodeFill('110')}/>
<Path id="111" d="M1735 123H1748V167.5H1733L1735 123Z" fill={getNodeFill('111')}/>
<Path id="112" d="M1732 169.5H1746V211.5H1732V169.5Z" fill={getNodeFill('112')}/>
<Rect id="113" x="1674" y="440.5" width="39" height="26" fill={getNodeFill('113')}/>
<Rect id="114" x="1633" y="416.5" width="39" height="50" fill={getNodeFill('114')}/>
<Rect id="115" x="1674" y="411.5" width="39" height="27" fill={getNodeFill('115')}/>
<Rect id="116" x="1674" y="382.5" width="39" height="27" fill={getNodeFill('116')}/>
<Rect id="117" x="1633" y="382.5" width="39" height="32" fill={getNodeFill('117')}/>
<Rect id="118" x="1633" y="339.5" width="80" height="19" fill={getNodeFill('118')}/>
<Rect id="119" x="1633" y="318.5" width="80" height="19" fill={getNodeFill('119')}/>
<Rect id="120" x="1673" y="263.5" width="39" height="33" fill={getNodeFill('120')}/>
<Rect id="121" x="1673" y="229.5" width="39" height="33" fill={getNodeFill('121')}/>
<Rect id="122" x="1633" y="228.5" width="39" height="33" fill={getNodeFill('122')}/>
<Rect id="123" x="1633" y="263.5" width="39" height="33" fill={getNodeFill('123')}/>
<Path id="124" d="M1687.75 155H1714.75L1713.25 193H1689.44L1687.75 155Z" fill={getNodeFill('124')}/>
<Path id="125" d="M1663.75 155H1684.75L1684.75 193H1663.75L1663.75 155Z" fill={getNodeFill('125')}/>
<Path id="126" d="M1639.75 155H1659.75V193H1639.75V155Z" fill={getNodeFill('126')}/>
<Path id="127" d="M1615.75 155H1635.75V193H1615.75V155Z" fill={getNodeFill('127')}/>
<Path id="128" d="M1587.75 155H1609.75V193H1587.75V155Z" fill={getNodeFill('128')}/>
<Path id="129" d="M1561.75 155H1582.75V193H1561.75V155Z" fill={getNodeFill('129')}/>
<Path id="130" d="M1537.75 155H1556.75L1556.75 193H1537.75V155Z" fill={getNodeFill('130')}/>
<Path id="131" d="M1512.75 155H1534.75V192H1512.75V155Z" fill={getNodeFill('131')}/>
<Path id="132" d="M1487.75 155L1509.75 155V192L1487.75 192V155Z" fill={getNodeFill('132')}/>
<Path id="133" d="M1462.75 155H1483.75V192H1462.75V155Z" fill={getNodeFill('133')}/>
<Path id="134" d="M1437.75 155H1458.75V192H1437.75V155Z" fill={getNodeFill('134')}/>
<Path id="135" d="M1439.75 98L1458.75 98.6067L1456.75 152H1437.75L1439.75 98Z" fill={getNodeFill('135')}/>
<Path id="136" d="M1460.29 98L1479.75 99.2273L1476.75 152H1458.75L1460.29 98Z" fill={getNodeFill('136')}/>
<Path id="137" d="M1481.42 99L1501.75 100.54V152H1479.75L1481.42 99Z" fill={getNodeFill('137')}/>
<Path id="138" d="M1503.75 101L1523.75 102.843V152H1503.75V101Z" fill={getNodeFill('138')}/>
<Path id="139" d="M1525.75 103.5L1544.75 105.754L1541.34 152H1525.75V103.5Z" fill={getNodeFill('139')}/>
<Path id="140" d="M1546 105.5L1566 107.5L1561.25 152H1542.75L1546 105.5Z" fill={getNodeFill('140')}/>
<Path id="141" d="M1569 108L1588 109.5L1581.75 152H1563.75L1569 108Z" fill={getNodeFill('141')}/>
<Path id="142" d="M1591.5 110L1611 112L1608.25 152H1585.75L1591.5 110Z" fill={getNodeFill('142')}/>
<Path id="143" d="M1613.5 112L1633.5 114L1632.24 152H1610.75L1613.5 112Z" fill={getNodeFill('143')}/>
<Path id="144" d="M1636 114L1655.5 115.5L1652.83 152H1634.75L1636 114Z" fill={getNodeFill('144')}/>
<Path id="145" d="M1658 116L1674.75 117.5V152H1655.75L1658 116Z" fill={getNodeFill('145')}/>
<Path id="146" d="M1677.75 118L1697.5 119.5L1697.75 152H1677.75V118Z" fill={getNodeFill('146')}/>
<Path id="147" d="M1700.75 120L1717.5 120.5L1716.72 152H1700.75V120Z" fill={getNodeFill('147')}/>
<Path id="148" d="M1395 92.5L1421 93.5L1418.83 130.5H1395V92.5Z" fill={getNodeFill('148')}/>
<Path id="149" d="M1367 91L1393 92.5V117.5H1367V91Z" fill={getNodeFill('149')}/>
<Path id="150" d="M1339 87.5L1365 90.5V117.5H1339V87.5Z" fill={getNodeFill('150')}/>
<Path id="151" d="M1339 119.5H1365V187.5L1352.5 175L1342 159.5L1336.5 141.5L1339 119.5Z" fill={getNodeFill('151')}/>
<Path id="152" d="M1395 170.5H1415V194.5H1395V170.5Z" fill={getNodeFill('152')}/>
<Path id="153" d="M1322 210.5L1316 201L1334.5 185.5L1344.5 194L1322 210.5Z" fill={getNodeFill('153')}/>
<Path id="154" d="M1324 277L1330.5 271.5L1347.5 298L1343 302L1324 277Z" fill={getNodeFill('154')}/>
<Path id="155" d="M1316.5 283L1323 277.5L1342.5 303.5L1336.5 309.5L1316.5 283Z" fill={getNodeFill('155')}/>
<Path id="156" d="M1333.5 385L1353.5 398.602L1344.12 452L1333.5 447.466V385Z" fill={getNodeFill('156')}/>
<Path id="157" d="M1359 399.5L1384.5 412L1377.5 457L1350.5 454L1359 399.5Z" fill={getNodeFill('157')}/>
<Path id="158" d="M1387.5 413.333H1406L1417.5 457.5H1382L1387.5 413.333Z" fill={getNodeFill('158')}/>
<Path id="159" d="M1409 410.5L1426 404L1452 445.5L1422.5 456.5L1409 410.5Z" fill={getNodeFill('159')}/>
<Path id="160" d="M1438 395.5L1450.5 382.5L1484 419.5L1469 433.5L1438 395.5Z" fill={getNodeFill('160')}/>
<Path id="161" d="M1452 381L1459.5 366.5L1497 401.5L1485 417.5L1452 381Z" fill={getNodeFill('161')}/>
<Path id="162" d="M1461 365L1463 353L1506.5 377.5L1497 399L1461 365Z" fill={getNodeFill('162')}/>
<Path id="163" d="M1464.5 351.5V344.5H1511.5L1506.5 376.5L1464.5 351.5Z" fill={getNodeFill('163')}/>
<Rect id="164" x="1574" y="417.5" width="36" height="45" fill={getNodeFill('164')}/>
<Rect id="165" x="1574" y="370.5" width="36" height="45" fill={getNodeFill('165')}/>
<Rect id="166" x="1574" y="323.5" width="36" height="45" fill={getNodeFill('166')}/>
<Rect id="167" x="1574" y="276.5" width="36" height="45" fill={getNodeFill('167')}/>
<Rect id="168" x="1574" y="229.5" width="36" height="45" fill={getNodeFill('168')}/>
<Rect id="169" x="1536" y="229.5" width="36" height="45" fill={getNodeFill('169')}/>
<Rect id="170" x="1536" y="276.5" width="36" height="45" fill={getNodeFill('170')}/>
<Rect id="171" x="1536" y="323.5" width="36" height="45" fill={getNodeFill('171')}/>
<Rect id="172" x="1536" y="370.5" width="36" height="45" fill={getNodeFill('172')}/>
<Rect id="173" x="1536" y="417.5" width="36" height="45" fill={getNodeFill('173')}/>
<Path id="174" d="M1218 564.5H1252V594.5H1218V564.5Z" fill={getNodeFill('174')}/>
<Path id="175" d="M1182 564.5H1216V594.5H1182V564.5Z" fill={getNodeFill('175')}/>
<Path id="176" d="M1145 564.5H1179V594.5H1145V564.5Z" fill={getNodeFill('176')}/>
<Path id="177" d="M1107 564.5H1141V594.5H1107V564.5Z" fill={getNodeFill('177')}/>
<Path id="178" d="M1069 527.5H1103V594.5H1069V527.5Z" fill={getNodeFill('178')}/>
<Path id="179" d="M1069 483.5H1125V521.5H1069V483.5Z" fill={getNodeFill('179')}/>
<Path id="180" d="M1132 483.5H1189V521.5H1132V483.5Z" fill={getNodeFill('180')}/>
<Path id="181" d="M1195 483.5H1252V521.5H1195V483.5Z" fill={getNodeFill('181')}/>
<Path id="182" d="M1218 526.5H1252V559.5H1218V526.5Z" fill={getNodeFill('182')}/>
<Path id="183" d="M1186 442.5H1248V466.5H1186V442.5Z" fill={getNodeFill('183')}/>
<Path id="184" d="M1218 411.5H1246V439.5H1218V411.5Z" fill={getNodeFill('184')}/>
<Path id="185" d="M1218 380.5H1246V409.5H1218V380.5Z" fill={getNodeFill('185')}/>
<Path id="186" d="M1218 350.5H1246V377.5H1218V350.5Z" fill={getNodeFill('186')}/>
<Path id="187" d="M1189 318.5H1246V346.5H1189V318.5Z" fill={getNodeFill('187')}/>
<Path id="188" d="M1187 186.5H1249V295.5H1187V186.5Z" fill={getNodeFill('188')}/>
<Path id="189" d="M1219.43 135.5L1251 137.204V181.5H1218L1219.43 135.5Z" fill={getNodeFill('189')}/>
<Path id="190" d="M1220.53 105.5L1252.5 106.5L1251 134.5L1219.5 132.5L1220.53 105.5Z" fill={getNodeFill('190')}/>
<Path id="191" d="M1222.5 79.5H1256L1254.5 105L1221 103.5L1222.5 79.5Z" fill={getNodeFill('191')}/>
<Path id="192" d="M1191 76.5H1217.5L1215.5 116H1189L1191 76.5Z" fill={getNodeFill('192')}/>
<Path id="193" d="M1189.04 117.5H1216L1213.96 181.5H1187L1189.04 117.5Z" fill={getNodeFill('193')}/>
<Path id="194" d="M1144.25 69.5H1174L1171.75 98.5H1142L1144.25 69.5Z" fill={getNodeFill('194')}/>
<Path id="195" d="M1111.13 68.5H1141L1138.75 96.5H1109L1111.13 68.5Z" fill={getNodeFill('195')}/>
<Path id="196" d="M1076.39 67.5H1108L1105.61 96.5H1074L1076.39 67.5Z" fill={getNodeFill('196')}/>
<Path id="197" d="M1104.39 114.5H1136L1133.61 143.5H1102L1104.39 114.5Z" fill={getNodeFill('197')}/>
<Path id="198" d="M1031 92H1055L1053 137.5H1028L1031 92Z" fill={getNodeFill('198')}/>
<Path id="199" d="M1031 61.5L1057 63L1055.78 89.5H1031V61.5Z" fill={getNodeFill('199')}/>
<Path id="200" d="M1006.05 60.5L1029 61.5L1027.5 88.5L1004.5 87.5L1006.05 60.5Z" fill={getNodeFill('200')}/>
<Path id="201" d="M980.967 57.5L1003 58.5L1002.41 86.5H979L980.967 57.5Z" fill={getNodeFill('201')}/>
<Path id="202" d="M955.049 56.5L978 57.5L977.389 85.5H953L955.049 56.5Z" fill={getNodeFill('202')}/>
<Path id="203" d="M929.967 55.5L952 56.5L951.413 84.5H928L929.967 55.5Z" fill={getNodeFill('203')}/>
<Path id="204" d="M926.213 107.5L951 108.224L950.34 128.5H924L926.213 107.5Z" fill={getNodeFill('204')}/>
<Path id="205" d="M878 49L908 50.5L906.5 125.5L876.5 124.5L878 49Z" fill={getNodeFill('205')}/>
<Path id="206" d="M845.304 85.5L874 86.8704V122.5H844L845.304 85.5Z" fill={getNodeFill('206')}/>
<Path id="207" d="M847.304 46.5L876 47.8704V83.5H846L847.304 46.5Z" fill={getNodeFill('207')}/>
<Path id="208" d="M803.5 41L827 42.25L825.4 78.25H803L803.5 41Z" fill={getNodeFill('208')}/>
<Path id="209" d="M780.933 40.25L802 40.75L801.463 77.25H780L780.933 40.25Z" fill={getNodeFill('209')}/>
<Path id="210" d="M729.5 84H755V99H729.5V84Z" fill={getNodeFill('210')}/>
<Path id="211" d="M731.5 99.9363L755 100V112L731.5 112V99.9363Z" fill={getNodeFill('211')}/>
<Path id="212" d="M719 130.5L749.5 132.5L751 159.5H723L719 130.5Z" fill={getNodeFill('212')}/>
<Path id="213" d="M724 161.5H751.5L756 190.5H728L724 161.5Z" fill={getNodeFill('213')}/>
<Path id="214" d="M729 192.5H756.5L760 218H732.5L729 192.5Z" fill={getNodeFill('214')}/>
<Path id="215" d="M758.5 192.5L816 191.5V211.5L762 215L758.5 192.5Z" fill={getNodeFill('215')}/>
<Path id="216" d="M788 136.5L818.5 138.5V165.5H792L788 136.5Z" fill={getNodeFill('216')}/>
<Path id="217" d="M738.5 242L817.75 233.5V263L741.5 271.5L738.5 242Z" fill={getNodeFill('217')}/>
<Path id="218" d="M741.75 273.823L818 266L817 295.5L746 304L741.75 273.823Z" fill={getNodeFill('218')}/>
<Path id="219" d="M734.75 327.016L772.844 324L780.75 362H740.5L734.75 327.016Z" fill={getNodeFill('219')}/>
<Path id="220" d="M741.75 364H780.422L786.75 400H747.375L741.75 364Z" fill={getNodeFill('220')}/>
<Path id="221" d="M748.75 402H788.669L793.75 434H753.831L748.75 402Z" fill={getNodeFill('221')}/>
<Path id="222" d="M755.75 435H793.868L800.75 467H760.89L755.75 435Z" fill={getNodeFill('222')}/>
<Path id="223" d="M788 387.96H817.5L818.5 467H805L788 387.96Z" fill={getNodeFill('223')}/>
<Path id="224" d="M775 323.96L818 321.5L817 386.5L786.5 386L775 323.96Z" fill={getNodeFill('224')}/>
<Path id="225" d="M761 487.5H796L799 522H765.5L761 487.5Z" fill={getNodeFill('225')}/>
<Path id="226" d="M766.5 525.5H799.5L803 558.5H772.5L766.5 525.5Z" fill={getNodeFill('226')}/>
<Path id="227" d="M773 561.5H807V591.5H778.5L773 561.5Z" fill={getNodeFill('227')}/>
<Path id="228" d="M809 561.5H837V591.5H809V561.5Z" fill={getNodeFill('228')}/>
<Path id="229" d="M842 561.5H870V591.5H842V561.5Z" fill={getNodeFill('229')}/>
<Path id="230" d="M872 561.5H901V591.5H872V561.5Z" fill={getNodeFill('230')}/>
<Path id="231" d="M873 521.5H902V556.5H873V521.5Z" fill={getNodeFill('231')}/>
<Path id="232" d="M873 487.5H902V517.5H873V487.5Z" fill={getNodeFill('232')}/>
<Path id="233" d="M921 525.5H936V592.5H921V525.5Z" fill={getNodeFill('233')}/>
<Path id="234" d="M938 554.5H945V592.5H938V554.5Z" fill={getNodeFill('234')}/>
<Path id="235" d="M946 554.5H953V592.5H946V554.5Z" fill={getNodeFill('235')}/>
<Path id="236" d="M955 554.5H962V592.5H955V554.5Z" fill={getNodeFill('236')}/>
<Path id="237" d="M1020 484.5H1051V547.5H1020V484.5Z" fill={getNodeFill('237')}/>
<Path id="238" d="M839 315.5H902V467.5H839V315.5Z" fill={getNodeFill('238')}/>
<Path id="239" d="M922 315.5H1017V467.5H922V315.5Z" fill={getNodeFill('239')}/>
<Path id="240" d="M1020 315.5H1051V467.5H1020V315.5Z" fill={getNodeFill('240')}/>
<Path id="241" d="M1069 315.5H1101V383.5H1069V315.5Z" fill={getNodeFill('241')}/>
<Path id="242" d="M1069 399.5H1101V467.5H1069V399.5Z" fill={getNodeFill('242')}/>
<Path id="243" d="M1119 315.5H1168V383.5H1119V315.5Z" fill={getNodeFill('243')}/>
<Path id="244" d="M1119 399.5H1168V467.5H1119V399.5Z" fill={getNodeFill('244')}/>
<Path id="245" d="M1070.5 160L1168.5 168V203.5L1070.5 194.5V160Z" fill={getNodeFill('245')}/>
<Path id="246" d="M920 146.5L1052 158V213H920V146.5Z" fill={getNodeFill('246')}/>
<Path id="247" d="M837 140.5L902 144.5V213H837V140.5Z" fill={getNodeFill('247')}/>
<Path id="248" d="M837 230.5H902V298.5H837.985L837 230.5Z" fill={getNodeFill('248')}/>
<Path id="249" d="M503 513.5L614 495L622 557.5H510L503 513.5Z" fill={getNodeFill('249')}/>
<Path id="250" d="M490 435L601 416.5L610 479L500.5 496L490 435Z" fill={getNodeFill('250')}/>
<Path id="251" d="M443 186L559 167.5L571 234.5L455 252.5L443 186Z" fill={getNodeFill('251')}/>
<Path id="252" d="M390 106.5L545 82.5L557 151.076L436 170L393.5 129L390 106.5Z" fill={getNodeFill('252')}/>
<Path id="253" d="M378.5 477.266L424.5 450L449 489.5L486.5 516.5L493 558H435L420 544L378.5 477.266Z" fill={getNodeFill('253')}/>
<Path id="254" d="M439.5 442.5L473.5 437L483 493L460.5 476.5L439.5 442.5Z" fill={getNodeFill('254')}/>
<Path id="255" d="M320 384.5L365 357L415 435.5L369.5 464L320 384.5Z" fill={getNodeFill('255')}/>
<Path id="256" d="M379 348L415.5 319L444.5 269L470.5 417L427.5 423L379 348Z" fill={getNodeFill('256')}/>
<Path id="257" d="M344 289.5L370.5 278L388.5 257L423 275.5L404 308L370.5 333L344 289.5Z" fill={getNodeFill('257')}/>
<Path id="258" d="M311 370L226.5 236.5L233.5 232H270.5L279 257.5L298 279.5L323 290L356.5 341.5L311 370Z" fill={getNodeFill('258')}/>

<Rect id="Rectangle 81" x="1780" y="525.5" width="26" height="26" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Rect id="Rectangle 125" x="1748" y="173.5" width="96" height="37" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Rect id="Rectangle 126" x="1754" y="230.5" width="52" height="13" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Rect id="Rectangle 124" x="1816" y="384.5" width="45" height="65" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Rect id="Rectangle 127" x="921" y="230.5" width="45" height="67" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 129" d="M544.159 258.66L545.148 258.516L545.445 260.547L544.456 260.691L544.753 262.723L545.742 262.578L546.039 264.609L545.05 264.754L545.347 266.785L546.336 266.641L546.633 268.672L545.644 268.816L545.94 270.848L546.93 270.703L547.227 272.734L546.237 272.879L546.534 274.91L547.523 274.766L547.82 276.797L546.831 276.941L547.128 278.973L548.117 278.828L548.414 280.859L547.425 281.004L547.722 283.035L548.711 282.891L549.008 284.922L548.019 285.066L548.315 287.098L549.305 286.953L549.602 288.984L548.612 289.129L548.909 291.16L549.898 291.016L550.195 293.047L549.206 293.191L549.503 295.223L550.492 295.078L550.789 297.109L549.8 297.254L550.097 299.285L551.086 299.141L551.383 301.172L550.394 301.316L550.69 303.348L551.68 303.203L551.977 305.234L550.987 305.379L551.284 307.41L552.273 307.266L552.57 309.297L551.581 309.441L551.878 311.473L552.867 311.328L553.164 313.359L552.175 313.504L552.472 315.535L553.461 315.391L553.758 317.422L552.769 317.566L553.065 319.598L554.055 319.453L554.352 321.484L553.362 321.629L553.51 322.639L551.557 322.912L551.418 321.922L549.455 322.197L549.594 323.188L547.63 323.462L547.492 322.473L545.53 322.747L545.669 323.737L543.705 324.012L543.567 323.022L541.605 323.297L541.744 324.287L539.781 324.562L539.643 323.572L537.68 323.848L537.817 324.837L535.856 325.112L535.718 324.122L533.755 324.397L533.893 325.387L531.932 325.662L531.793 324.672L529.83 324.947L529.969 325.938L528.005 326.212L527.867 325.223L525.905 325.497L526.044 326.487L524.08 326.762L523.942 325.772L521.98 326.047L522.119 327.037L520.156 327.312L520.018 326.322L518.055 326.598L518.192 327.587L516.231 327.862L516.093 326.872L514.13 327.147L514.268 328.137L512.307 328.412L512.168 327.422L510.205 327.697L510.344 328.688L508.38 328.962L508.242 327.973L506.28 328.247L506.419 329.237L504.455 329.512L504.317 328.522L502.355 328.797L502.494 329.787L500.531 330.062L500.393 329.072L498.43 329.348L498.567 330.337L496.606 330.612L496.468 329.622L494.505 329.897L494.643 330.887L492.682 331.162L492.542 330.172L490.58 330.447L490.719 331.438L488.755 331.712L488.617 330.723L486.655 330.997L486.794 331.987L484.83 332.262L484.692 331.272L482.729 331.547L482.869 332.537L480.906 332.812L480.768 331.822L478.805 332.098L478.942 333.087L476.981 333.362L476.979 333.354L476.989 333.354L476.841 332.354L475.852 332.5L475.555 330.5L476.544 330.354L476.247 328.354L475.258 328.5L474.961 326.5L475.95 326.354L475.653 324.354L474.664 324.5L474.367 322.5L475.356 322.354L475.06 320.354L474.07 320.5L473.773 318.5L474.763 318.354L474.466 316.354L473.477 316.5L473.18 314.5L474.169 314.354L473.872 312.354L472.883 312.5L472.586 310.5L473.575 310.354L473.278 308.354L472.289 308.5L471.992 306.5L472.981 306.354L472.685 304.354L471.695 304.5L471.398 302.5L472.388 302.354L472.091 300.354L471.102 300.5L470.805 298.5L471.794 298.354L471.497 296.354L470.508 296.5L470.211 294.5L471.2 294.354L470.903 292.354L469.914 292.5L469.617 290.5L470.606 290.354L470.31 288.354L469.32 288.5L469.023 286.5L470.013 286.354L469.716 284.354L468.727 284.5L468.43 282.5L469.419 282.354L469.122 280.354L468.133 280.5L467.836 278.5L468.825 278.354L468.528 276.354L467.539 276.5L467.242 274.5L468.231 274.354L467.935 272.354L466.945 272.5L466.648 270.5L467.638 270.354L467.489 269.354L467.481 269.354V269.35L469.443 269.05L469.595 270.038L471.558 269.738L471.406 268.75L473.368 268.449L473.369 268.45L473.52 269.438L475.482 269.139L475.331 268.15L475.33 268.149L477.294 267.85L477.445 268.839L479.407 268.538L479.256 267.55L481.219 267.25L481.37 268.238L483.332 267.938L483.182 266.95L483.181 266.949L485.143 266.649L485.144 266.65L485.295 267.639L487.258 267.339L487.106 266.35L489.068 266.05L489.22 267.038L491.183 266.738L491.031 265.75L492.993 265.449L492.994 265.45L493.145 266.438L495.107 266.139L494.956 265.15L494.955 265.149L496.919 264.85L497.07 265.839L499.032 265.538L498.881 264.55L500.844 264.25L500.995 265.238L502.957 264.938L502.807 263.95L502.806 263.949L504.768 263.649L504.769 263.65L504.92 264.639L506.883 264.339L506.731 263.35L508.693 263.05L508.845 264.038L510.808 263.738L510.656 262.75L512.618 262.449L512.619 262.45L512.77 263.438L514.732 263.139L514.581 262.15L514.58 262.149L516.544 261.85L516.695 262.839L518.657 262.538L518.506 261.55L520.469 261.25L520.62 262.238L522.582 261.938L522.432 260.95L522.431 260.949L524.393 260.649L524.394 260.65L524.545 261.639L526.508 261.339L526.356 260.35L528.318 260.05L528.47 261.038L530.433 260.738L530.281 259.75L532.243 259.449L532.244 259.45L532.395 260.438L534.357 260.139L534.206 259.15L534.205 259.149L536.169 258.85L536.32 259.839L538.282 259.538L538.131 258.55L540.094 258.25L540.245 259.238L542.207 258.938L542.057 257.95L542.056 257.949L544.011 257.65L544.159 258.66Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 130" d="M524.548 342.645V342.646L524.512 342.651L524.66 343.62L524.695 343.614L524.698 343.633L525.649 343.488L525.646 343.469H525.648L525.945 345.406L524.957 345.558L525.254 347.495L526.242 347.344L526.539 349.281L525.551 349.433L525.848 351.37L526.836 351.219L527.133 353.156L526.145 353.308L526.441 355.245L527.43 355.094L527.727 357.031L526.738 357.183L527.035 359.12L528.023 358.969L528.32 360.906L527.332 361.058L527.629 362.995L528.617 362.844L528.914 364.781L527.926 364.933L528.223 366.87L529.211 366.719L529.508 368.656L528.52 368.808L528.816 370.745L529.805 370.594L530.102 372.531L529.113 372.683L529.41 374.62L530.398 374.469L530.695 376.406L529.707 376.558L530.004 378.495L530.992 378.344L531.289 380.281L530.301 380.433L530.598 382.37L531.586 382.219L531.883 384.156L530.895 384.308L531.191 386.245L532.18 386.094L532.477 388.031L531.488 388.183L531.785 390.12L532.773 389.969L533.07 391.906L532.082 392.058L532.379 393.995L533.367 393.844L533.664 395.781L532.676 395.933L532.973 397.87L533.961 397.719L534.258 399.656L533.27 399.808L533.566 401.745L534.555 401.594L534.852 403.531L534.818 403.536L534.815 403.518L534.256 403.622L533.863 403.683L533.865 403.695L533.815 403.705L534 404.688L532 405.062L531.815 404.08L529.815 404.455L530 405.438L528 405.812L527.815 404.83L525.815 405.205L526 406.188L524 406.562L523.815 405.58L521.815 405.955L522 406.938L520 407.312L519.815 406.33L517.815 406.705L518 407.688L516 408.062L515.815 407.08L513.815 407.455L514 408.438L512 408.812L511.815 407.83L509.815 408.205L510 409.188L508 409.562L507.815 408.58L505.815 408.955L506 409.938L504 410.312L503.815 409.33L501.815 409.705L502 410.688L500 411.062L499.815 410.08L497.815 410.455L498 411.438L496 411.812L495.815 410.83L493.815 411.205L494 412.188L492 412.562L491.815 411.58L489.815 411.955L490 412.938L488 413.312L487.815 412.33L487.353 412.416L486.828 412.508L486.484 410.523L487.47 410.353L487.126 408.368L486.141 408.539L485.797 406.555L486.782 406.384L486.438 404.399L485.453 404.57L485.109 402.586L486.095 402.415L485.751 400.431L484.766 400.602L484.422 398.617L485.407 398.446L485.063 396.462L484.078 396.633L483.734 394.648L484.72 394.478L484.376 392.493L483.391 392.664L483.047 390.68L484.032 390.509L483.688 388.524L482.703 388.695L482.359 386.711L483.345 386.54L483.001 384.556L482.016 384.727L481.672 382.742L482.657 382.571L482.313 380.587L481.328 380.758L480.984 378.773L481.97 378.603L481.626 376.618L480.641 376.789L480.297 374.805L481.282 374.634L480.938 372.649L479.953 372.82L479.609 370.836L480.595 370.665L480.251 368.681L479.266 368.852L478.922 366.867L479.907 366.696L479.563 364.712L478.578 364.883L478.234 362.898L479.22 362.728L478.876 360.743L477.891 360.914L477.547 358.93L478.532 358.759L478.188 356.774L477.203 356.945L476.859 354.961L477.845 354.79L477.501 352.806L476.516 352.977L476.172 350.992L476.493 350.936L477.102 350.845L477.099 350.831L477.157 350.821L476.988 349.85L478.854 349.566L478.855 349.567L479.006 350.556L480.909 350.268L480.76 349.279L480.759 349.278L482.663 348.99L482.813 349.979L484.717 349.69L484.567 348.702L484.566 348.701L486.471 348.413L486.621 349.402L488.524 349.113L488.375 348.125L490.278 347.836L490.279 347.837L490.429 348.825L492.332 348.537L492.183 347.548L494.086 347.259L494.087 347.26L494.236 348.248L496.141 347.96L495.99 346.971L497.895 346.683L498.044 347.672L499.948 347.383L499.798 346.395L499.797 346.394L501.702 346.105L501.852 347.095L503.756 346.806L503.605 345.817L503.604 345.816L505.509 345.528L505.51 345.529L505.659 346.518L507.563 346.229L507.413 345.24L509.316 344.951L509.317 344.952L509.467 345.94L511.371 345.652L511.221 344.663L513.125 344.375L513.274 345.363L515.179 345.075L515.029 344.087L515.028 344.086L516.933 343.798L517.082 344.787L518.986 344.498L518.837 343.51L518.836 343.509L520.74 343.221L520.891 344.21L522.794 343.922L522.645 342.933L524.547 342.644L524.548 342.645Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 128" d="M1074 196.781L1073.91 197.777L1075.91 197.965L1076 196.969L1078 197.156L1077.91 198.152L1079.91 198.34L1080 197.344L1082 197.531L1081.91 198.527L1083.91 198.715L1084 197.719L1086 197.906L1085.91 198.902L1087.91 199.09L1088 198.094L1090 198.281L1089.91 199.277L1091.91 199.465L1092 198.469L1094 198.656L1093.91 199.652L1095.91 199.84L1096 198.844L1098 199.031L1097.91 200.027L1099.91 200.215L1100 199.219L1102 199.406L1101.91 200.402L1103.91 200.59L1104 199.594L1106 199.781L1105.91 200.777L1107.91 200.965L1108 199.969L1110 200.156L1109.91 201.152L1111.91 201.34L1112 200.344L1114 200.531L1113.91 201.527L1115.91 201.715L1116 200.719L1118 200.906L1117.91 201.902L1119.91 202.09L1120 201.094L1122 201.281L1121.91 202.277L1123.91 202.465L1124 201.469L1126 201.656L1125.91 202.652L1127.91 202.84L1128 201.844L1130 202.031L1129.91 203.027L1131.91 203.215L1132 202.219L1134 202.406L1133.91 203.402L1135.91 203.59L1136 202.594L1138 202.781L1137.91 203.777L1139.91 203.965L1140 202.969L1142 203.156L1141.91 204.152L1143.91 204.34L1144 203.344L1146 203.531L1145.91 204.527L1147.91 204.715L1148 203.719L1150 203.906L1149.91 204.902L1151.91 205.09L1152 204.094L1154 204.281L1153.91 205.277L1155.91 205.465L1156 204.469L1158 204.656L1157.91 205.652L1159.91 205.84L1160 204.844L1162 205.031L1161.91 206.027L1163.91 206.215L1164 205.219L1166 205.406L1165.91 206.402L1165.98 206.409V206.467L1166.72 206.479L1166.91 206.496L1166.91 206.481L1166.98 206.483L1166.95 208.45L1165.95 208.435L1165.92 210.402L1166.92 210.418L1166.89 212.386L1165.89 212.369L1165.85 214.337L1166.85 214.353L1166.82 216.32L1165.82 216.304L1165.79 218.271L1166.79 218.287L1166.75 220.255L1165.76 220.239L1165.72 222.206L1166.72 222.223L1166.69 224.189L1165.69 224.174L1165.66 226.141L1166.66 226.157L1166.62 228.125L1165.62 228.108L1165.59 230.076L1166.59 230.092L1166.56 232.06L1165.56 232.043L1165.53 234.011L1166.53 234.026L1166.49 235.994L1165.5 235.978L1165.46 237.945L1166.46 237.962L1166.43 239.929L1165.43 239.913L1165.4 241.88L1166.4 241.896L1166.36 243.863L1165.36 243.848L1165.33 245.814L1166.33 245.831L1166.3 247.799L1165.3 247.782L1165.27 249.75L1166.27 249.766L1166.23 251.733L1165.23 251.717L1165.2 253.685L1166.2 253.7L1166.17 255.668L1165.17 255.652L1165.14 257.619L1166.14 257.636L1166.1 259.603L1165.1 259.587L1165.07 261.554L1166.07 261.57L1166.04 263.537L1165.04 263.521L1165.01 265.489L1166 265.505L1165.97 267.473L1164.97 267.456L1164.94 269.424L1165.94 269.439L1165.91 271.407L1164.91 271.391L1164.88 273.358L1165.88 273.375L1165.84 275.342L1164.84 275.326L1164.81 277.293L1165.81 277.31L1165.78 279.276L1164.78 279.261L1164.75 281.228L1165.74 281.244L1165.71 283.212L1164.71 283.195L1164.68 285.163L1165.68 285.179L1165.65 287.146L1164.65 287.13L1164.61 289.098L1165.61 289.113L1165.58 291.081L1164.58 291.065L1164.55 293.032L1165.55 293.049L1165.52 295.016H1165.5V295H1164.52V295.033L1164.5 295.983H1164.52V296H1162.55V295H1160.58V296H1158.61V295H1156.64V296H1154.67V295H1152.7V296H1150.73V295H1148.77V296H1146.8V295H1144.83V296H1142.86V295H1140.89V296H1138.92V295H1136.95V296H1134.98V295H1133.02V296H1131.05V295H1129.08V296H1127.11V295H1125.14V296H1123.17V295H1121.2V296H1119.23V295H1117.27V296H1115.3V295H1113.33V296H1111.36V295H1109.39V296H1107.42V295H1105.45V296H1103.48V295H1101.52V296H1099.55V295H1097.58V296H1095.61V295H1093.64V296H1091.67V295H1089.7V296H1087.73V295H1085.77V296H1083.8V295H1081.83V296H1079.86V295H1077.89V296H1075.92V295H1073.95V296H1072V295.005H1071.98V295H1071V293.015H1072V291.025H1071V289.035H1072V287.045H1071V285.055H1072V283.065H1071V281.075H1072V279.085H1071V277.095H1072V275.105H1071V273.115H1072V271.125H1071V269.135H1072V267.146H1071V265.155H1072V263.165H1071V261.175H1072V259.185H1071V257.195H1072V255.205H1071V253.215H1072V251.225H1071V249.235H1072V247.245H1071V245.255H1072V243.265H1071V241.275H1072V239.285H1071V237.295H1072V235.305H1071V233.315H1072V231.325H1071V229.335H1072V227.345H1071V225.355H1072V223.365H1071V221.375H1072V219.385H1071V217.395H1072V215.405H1071V213.415H1072V211.425H1071V209.435H1072V207.445H1071V205.455H1072V203.465H1071V201.475H1072V199.485H1071V197.505L1071.91 197.59L1071.92 197.495H1072V196.594L1074 196.781Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Rect id="Rectangle 114" x="1973" y="479.5" width="24" height="26" fill="#999999"/>
<Path id="Rectangle 115" d="M1391 119.5V120.5H1392V122.219H1391V124.031H1392V125.844H1391V127.656H1392V129.469H1391V131.281H1392V133.094H1391V135H1392.98V134H1394.94V135H1396.9V134H1398.85V135H1400.81V134H1402.77V135H1404.73V134H1406.69V135H1408.65V134H1410.6V135H1412.56V134H1414.5V135.047H1415.5V137.141H1414.5V139.234H1415.5V141.328H1414.5V143.422H1415.5V145.516H1414.5V147.609H1415.5V149.703H1414.5V151.797H1415.5V153.891H1414.5V155.984H1415.5V158.078H1414.5V160.172H1415.5V162.266H1414.5V164.359H1415.5V166.453H1414.5V167.5H1412.56V166.5H1410.6V167.5H1408.65V166.5H1406.69V167.5H1404.73V166.5H1402.77V167.5H1400.81V166.5H1398.85V167.5H1396.9V166.5H1394.94V167.5H1392.98V166.5H1391V168.562H1392V170.688H1391V172.812H1392V174.938H1391V177.062H1392V179.188H1391V181.312H1392V183.438H1391V185.562H1392V187.688H1391V189.812H1392V191.938H1391.9L1391.26 191.764L1391.21 191.938H1391V192.729L1389 192.188L1389.26 191.223L1387.26 190.681L1387 191.646H1387L1385 191.104L1385.26 190.139L1383.26 189.598L1383 190.562L1381 190.021H1381L1381.26 189.056L1379.26 188.514L1379 189.479L1377 188.938L1377.26 187.973L1375.26 187.431L1375 188.396H1375L1373 187.854L1373.26 186.889L1371.26 186.348L1371 187.312L1369 186.771H1369L1369.26 185.806L1369 185.734V185.515H1368V183.544H1369V181.573H1368V179.603H1369V177.633H1368V175.662H1369V173.691H1368V171.721H1369V169.75H1368V167.779H1369V165.809H1368V163.838H1369V161.867H1368V159.897H1369V157.927H1368V155.956H1369V153.985H1368V152.015H1369V150.044H1368V148.073H1369V146.103H1368V144.133H1369V142.162H1368V140.191H1369V138.221H1368V136.25H1369V134.279H1368V132.309H1369V130.338H1368V128.367H1369V126.397H1368V124.427H1369V122.456H1368V120.5H1369V119.5H1371V120.5H1373V119.5H1375V120.5H1377V119.5H1379V120.5H1381V119.5H1383V120.5H1385V119.5H1387V120.5H1389V119.5H1391Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 116" d="M1214.96 523.5V524.5H1215V524.562H1216V526.684H1215V528.806H1216V530.929H1215V533.051H1216V535.174H1215V537.296H1216V539.418H1215V541.541H1216V543.663H1215V545.786H1216V547.908H1215V550.097H1216V552.352H1215V554.607H1216V556.862H1215V559.117H1216V561.372H1215V561.5H1214.96V562.5H1212.89V561.5H1210.81V562.5H1208.74V561.5H1206.67V562.5H1204.59V561.5H1202.52V562.5H1200.44V561.5H1198.37V562.5H1196.3V561.5H1194.22V562.5H1192.15V561.5H1190.07V562.5H1188V561.5H1185.93V562.5H1183.85V561.5H1181.78V562.5H1179.7V561.5H1177.63V562.5H1175.56V561.5H1173.48V562.5H1171.41V561.5H1169.33V562.5H1167.26V561.5H1165.18V562.5H1163.11V561.5H1161.09V562.5H1159.12V561.5H1157.16V562.5H1155.19V561.5H1153.22V562.5H1151.26V561.5H1149.29V562.5H1147.32V561.5H1145.35V562.5H1143.39V561.5H1141.42V562.5H1139.45V561.5H1137.49V562.5H1135.52V561.5H1133.55V562.5H1131.59V561.5H1129.62V562.5H1127.65V561.5H1125.69V562.5H1123.72V561.5H1121.75V562.5H1119.79V561.5H1117.82V562.5H1115.85V561.5H1113.88V562.5H1111.92V561.5H1109.95V562.5H1108V561.525H1107.98V561.5H1107V559.575H1108V557.625H1107V555.675H1108V553.725H1107V551.775H1108V549.825H1107V547.875H1108V545.925H1107V543.975H1108V542.025H1107V540.075H1108V538.125H1107V536.175H1108V534.225H1107V532.275H1108V530.325H1107V528.375H1108V526.425H1107V524.5H1107.98V524.475H1108V523.5H1109.95V524.5H1111.92V523.5H1113.88V524.5H1115.85V523.5H1117.82V524.5H1119.79V523.5H1121.75V524.5H1123.72V523.5H1125.69V524.5H1127.65V523.5H1129.62V524.5H1131.59V523.5H1133.55V524.5H1135.52V523.5H1137.49V524.5H1139.45V523.5H1141.42V524.5H1143.39V523.5H1145.35V524.5H1147.32V523.5H1149.29V524.5H1151.26V523.5H1153.22V524.5H1155.19V523.5H1157.16V524.5H1159.12V523.5H1161.09V524.5H1163.11V523.5H1165.17V524.5H1167.24V523.5H1169.31V524.5H1171.38V523.5H1173.45V524.5H1175.51V523.5H1177.58V524.5H1179.65V523.5H1181.72V524.5H1183.78V523.5H1185.85V524.5H1187.92V523.5H1189.99V524.5H1192.06V523.5H1194.14V524.5H1196.22V523.5H1198.31V524.5H1200.39V523.5H1202.47V524.5H1204.55V523.5H1206.63V524.5H1208.71V523.5H1210.8V524.5H1212.88V523.5H1214.96Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 122" d="M774.854 89.0625L776.896 89.1865V89.1875L776.835 90.1855L778.876 90.3105L778.938 89.3125L780.979 89.4375H780.979L780.918 90.4355L781.938 90.498L783 90.5635V88.583H782.057L782.062 88.502L782 88.498V86.75H783V84.917H782V83.083H783V81.25H782V79.502L782.964 79.5723L782.976 79.417H783V79.0732L783.036 78.5752V78.5742L785.106 78.7246L785.035 79.7227L787.106 79.8721L787.179 78.875V78.874L789.251 79.0244V79.0254L789.179 80.0225L791.25 80.1729L791.321 79.1748L793.394 79.3242V79.3252L793.321 80.3223L795.393 80.4727L795.464 79.4746L797.536 79.625H797.537L797.465 80.6221L799.536 80.7725L799.608 79.7754V79.7744L801.679 79.9248L801.607 80.9229L802.644 80.9971L802.68 81H803.656V80H805.537V81H807.418V80H809.298V81H811.179V80H813.06V81H815.375V80H818.125V81H819.5V83H818.5V85H819.5V87H818.5V89H819.5V91H818.5V93H819.5V95H818.5V97H819.5V99H818.5V101H819.5V103H818.5V105.042H819.5V107.125H818.5V109.208H819.5V111.292H818.5V113.375H819.5V115.458H818.776L818.655 115.451V115.458H818.5V116.444L816.799 116.35H816.8L816.855 115.352L815.056 115.252L815 116.25L813.2 116.149L813.256 115.151L811.455 115.052L811.4 116.05H811.399L809.6 115.949L809.655 114.951L807.855 114.852L807.8 115.85H807.799L806 115.75L806.056 114.752L804.256 114.651L804.2 115.649L802.399 115.55H802.4L802.455 114.552L801.576 114.503H801.577L800.602 114.428L800.525 115.425H800.524L798.575 115.274L798.651 114.278L796.702 114.128L796.625 115.125L794.674 114.975H794.675L794.752 113.978L792.802 113.828L792.725 114.824L790.774 114.675H790.775L790.852 113.678L788.901 113.528L788.825 114.524L786.875 114.375L786.952 113.378L785.002 113.228L784.925 114.225H784.924L782.975 114.074L783.052 113.078L782.077 113.003L782.069 113.002H782.062L781.04 112.939L780.979 113.938L778.938 113.812L778.999 112.814L776.957 112.689L776.896 113.687L774.854 113.562L774.915 112.564L772.874 112.439L772.812 113.438L770.771 113.312L770.832 112.314L768.79 112.189L768.729 113.188L766.688 113.062L766.749 112.064L764.707 111.939L764.646 112.937L762.604 112.812L762.665 111.814L760.624 111.689L760.562 112.688L758.521 112.562L758.582 111.564L758.5 111.559V111.479H757.5V109.438H758.5V107.396H757.5V105.354H758.5V103.312H757.5V101.271H758.5V99.2295H757.5V97.1875H758.5V95.1455H757.5V93.1045H758.5V91.0625H757.5V89.0205H757.806L758.46 89.0605L758.462 89.0205H758.5V88.4004L758.521 88.0625V88.0615L760.562 88.1875L760.501 89.1855L762.543 89.3105L762.604 88.3125L764.646 88.4365V88.4375L764.585 89.4355L766.626 89.5605L766.688 88.5625L768.729 88.6875H768.729L768.668 89.6855L770.71 89.8105L770.771 88.8125V88.8115L772.812 88.9375L772.751 89.9355L774.793 90.0605L774.854 89.0625Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 123" d="M788.479 153.018L788.771 155.011V155.012L787.781 155.157L788.073 157.152L789.062 157.008V157.007L789.354 159.003H789.354L788.364 159.147L788.509 160.132V160.133L788.634 161.07L789.625 160.937L789.875 162.812L788.884 162.945L789.134 164.82L790.125 164.687L790.375 166.562L789.384 166.695L789.509 167.633L789.624 168.5H791.446V167.5H793.339V168.5H795.232V167.5H797.125V168.5H799.018V167.5H800.911V168.5H802.804V167.5H804.696V168.5H806.589V167.5H808.482V168.5H810.375V167.5H812.268V168.5H814.161V167.5H815.997L815.939 168.348L816.054 168.356V168.5H816.932L816.812 170.25L815.814 170.182L815.689 172.015L816.687 172.083L816.562 173.916L815.564 173.848L815.439 175.682L816.438 175.75L816.312 177.583L815.314 177.515L815.189 179.348L816.187 179.416L816.062 181.25L815.064 181.182L814.939 183.015L815.937 183.083L815.812 184.916L814.814 184.848L814.689 186.682L815.688 186.75L815.562 188.583L815.5 188.579V188.5H814.522V189.131L814.502 189.432L814.522 189.433V189.5H812.568V188.5H810.613V189.5H808.659V188.5H806.704V189.5H804.75V188.5H802.796V189.5H800.841V188.5H798.887V189.5H796.932V188.5H794.978V189.5H793.022V188.5H791.068V189.5H789.113V188.5H787.159V189.5H785.204V188.5H783.25V189.5H781.296V188.5H779.341V189.5H777.387V188.5H775.432V189.5H773.478V188.5H772.464L772.429 188.503L771.554 188.565L771.625 189.562L769.875 189.687L769.804 188.69L768.054 188.815L768.125 189.812L766.375 189.937L766.304 188.94L764.554 189.065L764.625 190.062L762.875 190.187L762.804 189.19L761.054 189.315L761.125 190.312L759.375 190.437L759.366 190.326L759.48 190.303L759.272 189.262L758.291 189.459L757.875 187.375L758.855 187.178L758.438 185.095L757.458 185.291L757.041 183.209L758.022 183.012L757.605 180.928L756.625 181.125L756.208 179.041L757.188 178.845L756.772 176.762L755.791 176.959L755.375 174.875L756.355 174.678L755.938 172.595L754.958 172.791L754.541 170.709L755.522 170.512L755.105 168.428L754.125 168.625L753.708 166.541L754.688 166.345L754.485 165.33L754.322 164.228L753.333 164.374L753 162.125L753.989 161.978L753.656 159.728L752.666 159.875L752.333 157.624L753.322 157.478L752.989 155.228L752 155.375L751.666 153.125L752.656 152.978L752.489 151.853L752.488 151.846L752.363 151.042L751.375 151.194L751.125 149.585L752.113 149.432L751.863 147.822L750.874 147.975L750.624 146.366L751.613 146.213L751.5 145.483V144.644H750.5V142.811H751.5V140.978H750.5V139.144H751.5V137.311H750.5V135.563L751.464 135.634L751.476 135.478H751.5V135.135L751.536 134.636V134.635L753.606 134.786L753.535 135.784L755.606 135.933L755.679 134.936V134.935L757.751 135.086V135.087L757.679 136.084L759.75 136.234L759.821 135.236L761.894 135.385V135.386L761.821 136.384L763.893 136.534L763.964 135.536L766.036 135.686H766.037L765.965 136.683L768.036 136.834L768.108 135.837V135.836L770.179 135.986L770.107 136.984L771.144 137.058L771.18 137.061H772.156V136.061H774.037V137.061H775.918V136.061H777.798V137.061H779.679V136.061H781.56V137.061H783.375V136.061H785.125V136.188L785.011 136.206L785.125 136.989V137.061H785.136L785.156 137.204L786.146 137.058V137.057L786.437 139.053H786.438L785.448 139.198L785.739 141.193L786.729 141.049L787.021 143.043V143.044L786.031 143.188L786.323 145.183L787.312 145.038L787.604 147.033H787.604L786.614 147.177L786.906 149.173L787.896 149.028V149.027L788.188 151.022V151.023L787.198 151.168L787.489 153.163L788.479 153.018Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 120" d="M965 486.5V487.562H966V489.684H965V491.806H966V493.929H965V496.051H966V498.174H965V500.296H966V502.418H965V504.541H966V506.663H965V508.786H966V510.908H965V512.958H966V514.935H965V516.911H966V518.888H965V520.864H966V522.84H965V524.816H966V526.793H965V528.77H966V530.746H965V532.723H966V534.699H965V536.676H966V538.652H965V540.629H966V542.605H965V544.582H966V546.559H965V548.535H966V550.5H965.018V550.512H965V551.5H963.054V550.5H961.089V551.5H959.125V550.5H957.161V551.5H955.196V550.5H953.232V551.5H951.268V550.5H949.304V551.5H947.339V550.5H945.375V551.5H943.411V550.5H941.446V551.5H939.5V550.571H939.482V550.5H938.5V548.714H939.5V546.857H938.5V545H939.5V543.143H938.5V541.286H939.5V539.429H938.5V537.571H939.5V535.714H938.5V533.857H939.5V532H938.5V530.143H939.5V528.286H938.5V526.429H939.5V524.5H937.469V525.5H935.406V524.5H933.344V525.5H931.281V524.5H929.219V525.5H927.156V524.5H925.094V525.5H923.031V524.5H922V522.575H923V520.625H922V518.675H923V516.725H922V514.775H923V512.825H922V510.875H923V508.925H922V506.975H923V505.025H922V503.075H923V501.125H922V499.175H923V497.225H922V495.275H923V493.325H922V491.375H923V489.425H922V487.5H922.927V487.475H923V486.5H924.779V487.5H926.632V486.5H928.484V487.5H930.337V486.5H932.189V487.5H934.042V486.5H935.895V487.5H937.747V486.5H939.6V487.5H941.452V486.5H943.306V487.5H945.205V486.5H947.153V487.5H949.101V486.5H951.048V487.5H952.995V486.5H954.943V487.5H956.757V486.5H958.438V487.5H960.118V486.5H961.799V487.5H963.479V486.5H965Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 118" d="M1215 351.5V352.526H1216V354.579H1215V356.631H1216V358.684H1215V360.736H1216V362.789H1215V364.841H1216V366.894H1215V368.946H1216V370.998H1215V373.051H1216V375.104H1215V377.156H1216V379.208H1215V381.261H1216V383.313H1215V385.366H1216V387.418H1215V389.471H1216V391.523H1215V393.576H1216V395.628H1215V397.681H1216V399.733H1215V401.786H1216V403.838H1215V405.891H1216V407.943H1215V409.924H1216V411.832H1215V413.74H1216V415.648H1215V417.556H1216V419.464H1215V421.372H1216V423.28H1215V425.188H1216V427.097H1215V429.005H1216V430.913H1215V432.821H1216V434.729H1215V436.638H1216V438.5H1214.89V439.5H1212.66V438.5H1210.43V439.5H1208.21V438.5H1205.98V439.5H1203.75V438.5H1201.5V439.5H1199.23V438.5H1196.96V439.5H1194.68V438.5H1192.41V439.5H1190.14V438.5H1189V436.5H1190V434.5H1189V432.5H1190V430.5H1189V428.5H1190V426.5H1189V424.5H1190V422.5H1189V420.5H1190V418.5H1189V416.5H1190V414.5H1189V412.5H1190V410.5H1189V408.5H1190V406.5H1189V404.5H1190V402.5H1189V400.5H1190V398.5H1189V396.5H1190V394.5H1189V392.5H1190V390.5H1189V388.5H1190V386.5H1189V384.5H1190V382.5H1189V380.5H1190V378.5H1189V376.5H1190V374.5H1189V372.5H1190V370.5H1189V368.5H1190V366.5H1189V364.5H1190V362.5H1189V360.5H1190V358.5H1189V356.5H1190V354.5H1189V352.5H1190.14V351.5H1192.41V352.5H1194.68V351.5H1196.96V352.5H1199.23V351.5H1201.5V352.5H1203.54V351.5H1205.33V352.5H1207.12V351.5H1208.92V352.5H1210.59V351.5H1212.13V352.5H1213.68V351.5H1215Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 121" d="M1021.57 91.0625L1023.55 91.1875L1023.49 92.1855L1025.47 92.3105L1025.53 91.3125V91.3115L1027.51 91.4365V91.4375L1027.51 91.4395H1027.5L1027.44 92.4775L1028.44 92.5371L1028.31 94.6123L1027.31 94.5527L1027.19 96.627L1028.19 96.6875L1028.06 98.7617L1027.06 98.7021L1026.94 100.777L1027.94 100.837L1027.81 102.912L1026.81 102.853L1026.69 104.928L1027.69 104.987L1027.56 107.062L1026.56 107.002L1026.44 109.077L1027.44 109.137L1027.31 111.212L1026.31 111.152L1026.19 113.228L1027.19 113.287L1027.06 115.362L1026.06 115.303L1025.94 117.377L1026.94 117.438L1026.81 119.512L1025.81 119.452L1025.69 121.527L1026.69 121.587L1026.56 123.662L1025.56 123.603L1025.44 125.678L1026.44 125.737L1026.31 127.812L1025.31 127.752L1025.19 129.827L1026.19 129.887L1026.06 131.962L1025.06 131.902L1025 132.939L1025.03 132.94V132.947H1025.03L1023.08 132.842H1023.08L1023.13 131.844L1021.19 131.738L1021.13 132.736L1019.18 132.631L1019.24 131.633L1017.29 131.527L1017.24 132.525L1015.29 132.421H1015.29L1015.34 131.423L1013.4 131.317L1013.34 132.315H1013.34L1011.39 132.21L1011.45 131.212L1009.5 131.106L1009.45 132.104L1007.5 132L1007.55 131.001L1005.61 130.896L1005.55 131.895H1005.55L1003.6 131.789H1003.61L1003.66 130.791L1001.71 130.686L1001.66 131.684L999.711 131.578L999.765 130.58L997.817 130.476L997.763 131.474H997.762L995.814 131.368H995.815L995.87 130.37L993.923 130.265L993.868 131.263H993.867L991.921 131.157L991.975 130.159L990.027 130.054L989.974 131.052L988.025 130.947H988.026L988.08 129.949L986.133 129.844L986.079 130.842H986.078L984.132 130.736L984.186 129.738L982.238 129.633L982.185 130.631L980.237 130.525L980.291 129.527L978.344 129.423L978.289 130.421H978.288L976.341 130.315H976.342L976.396 129.317L974.448 129.212L974.395 130.21L972.447 130.104L972.501 129.106L970.554 129.001L970.5 130L968.552 129.895H968.553L968.606 128.896L966.659 128.791L966.605 129.789H966.604L964.658 129.684L964.712 128.686L962.765 128.58L962.711 129.578L960.762 129.474H960.763L960.817 128.476L958.87 128.37L958.815 129.368H958.814L956.867 129.263H956.868L956.923 128.265L954.975 128.159L954.921 129.157L952.974 129.052L952.977 129H953V128.562L953.027 128.054L952.054 128.001L952.049 128.083H952V126.25H953V124.417H952V122.583H953V120.75H952V118.917H953V117.083H952V115.25H953V113.417H952V111.583H953V109.75H952V107.917H953V106.141L952.15 106.012L950.918 105.824L950.768 106.812L948.303 106.438L948.454 105.449L945.989 105.074L945.839 106.062L943.374 105.687L943.524 104.699L942.293 104.512L942.218 104.5H941.195V105.5H939.303V104.5H937.41V105.5H935.518V104.5H933.625V105.5H931.731V104.5H929.839V105.5H928.003L928.072 104.629L927.946 104.618V104.5H927.079L927.225 102.65L928.222 102.729L928.372 100.829L927.375 100.75L927.524 98.8486L927.525 98.8496L928.521 98.9287L928.672 97.0283L927.675 96.9502L927.824 95.0488L927.825 95.0498L928.822 95.1289L928.972 93.2285L927.975 93.1504L928.125 91.25L929.122 91.3291L929.271 89.4287L928.275 89.3496L928.274 89.3486L928.425 87.4502L928.5 87.4561V87.5H929.061L929.422 87.5283L929.424 87.5H929.637V86.5H931.91V87.5H934.185V86.5H936.458V87.5H938.731V86.5H941.005V87.5H943.038V86.5H944.831V87.5H946.624V86.5H948.416V87.5H949.28L950.239 87.5605L950.302 86.5625L952.281 86.6875H952.282L952.219 87.6855L954.198 87.8105L954.262 86.8125L956.241 86.9365V86.9375L956.179 87.9355L958.158 88.0605L958.221 87.0625V87.0615L960.2 87.1875H960.201L960.138 88.1855L962.117 88.3105L962.18 87.3125L964.16 87.4375L964.097 88.4355L966.077 88.5605L966.14 87.5625V87.5615L968.119 87.6865V87.6875L968.057 88.6855L970.036 88.8105L970.099 87.8125L972.078 87.9375H972.079L972.016 88.9355L973.995 89.0605L974.059 88.0625L976.038 88.1865V88.1875L975.976 89.1855L977.955 89.3105L978.018 88.3125V88.3115L979.997 88.4375H979.998L979.935 89.4355L981.914 89.5605L981.977 88.5625L983.957 88.6875L983.894 89.6855L985.874 89.8105L985.937 88.8125V88.8115L987.916 88.9365V88.9375L987.854 89.9355L989.833 90.0605L989.896 89.0625L991.875 89.1875H991.876L991.812 90.1855L993.792 90.3105L993.855 89.3125L995.835 89.4365V89.4375L995.772 90.4355L997.752 90.5605L997.814 89.5625V89.5615L999.794 89.6875H999.795L999.731 90.6855L1001.71 90.8105L1001.77 89.8125L1003.75 89.9375L1003.69 90.9355L1005.67 91.0605L1005.73 90.0625V90.0615L1007.71 90.1865V90.1875L1007.65 91.1855L1009.63 91.3105L1009.69 90.3125L1011.67 90.4375H1011.67L1011.61 91.4355L1013.59 91.5605L1013.65 90.5625L1015.63 90.6865V90.6875L1015.57 91.6855L1017.55 91.8105L1017.61 90.8125V90.8115L1019.59 90.9375H1019.59L1019.53 91.9355L1021.51 92.0605L1021.57 91.0625Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 119" d="M1150.81 100L1152.78 100.052V100.053L1152.75 101.053L1154.72 101.104L1154.74 100.105V100.104L1156.71 100.157V100.158L1156.68 101.157L1158.65 101.21L1158.68 100.211V100.21L1160.64 100.263L1160.62 101.263L1162.59 101.315L1162.61 100.315L1164.58 100.368L1164.55 101.368L1166.52 101.421L1166.55 100.421L1168.5 100.473L1168.45 101.448L1168.49 101.45V101.474L1169.42 101.498L1169.45 101.499L1169.34 103.5L1168.34 103.448L1168.24 105.448L1169.24 105.5L1169.13 107.499L1168.14 107.448L1168.03 109.448L1169.03 109.5L1168.93 111.5L1167.93 111.448L1167.82 113.448L1168.82 113.499L1168.72 115.5L1167.72 115.448L1167.62 117.448L1168.61 117.5L1168.51 119.499L1167.51 119.448L1167.41 121.448L1168.41 121.5L1168.3 123.5L1167.3 123.448L1167.2 125.448L1168.2 125.499L1168.09 127.5L1167.09 127.448L1166.99 129.448L1167.99 129.5L1167.88 131.499L1166.89 131.448L1166.78 133.448L1167.78 133.5L1167.68 135.5L1166.68 135.448L1166.57 137.448L1167.57 137.499L1167.47 139.5L1166.47 139.448L1166.37 141.448L1167.36 141.5L1167.26 143.499L1166.26 143.448L1166.16 145.448L1167.16 145.5L1167.05 147.5L1167.03 147.498L1166.11 147.425L1166.11 147.45L1166.05 147.448L1166 148.419L1164.09 148.266L1164.17 147.269L1162.24 147.112L1162.16 148.109L1160.22 147.953L1160.3 146.956L1158.36 146.8L1158.28 147.797L1156.34 147.641L1156.42 146.644L1154.49 146.487L1154.41 147.484L1152.47 147.328L1152.55 146.331L1150.61 146.175L1150.53 147.172L1148.59 147.016L1148.67 146.019L1146.74 145.862L1146.66 146.859L1144.72 146.703L1144.8 145.706L1142.86 145.55L1142.78 146.547L1140.84 146.391L1140.92 145.394L1138.99 145.237L1138.91 146.234L1137 146.08L1137.09 145.06L1136.09 144.969L1136.28 142.906L1137.28 142.997L1137.46 140.935L1136.47 140.844L1136.66 138.781L1137.65 138.872L1137.84 136.81L1136.84 136.719L1137.03 134.656L1138.03 134.747L1138.21 132.685L1137.22 132.594L1137.41 130.531L1138.4 130.622L1138.59 128.56L1137.59 128.469L1137.78 126.406L1138.78 126.497L1138.96 124.435L1137.97 124.344L1138.16 122.281L1139.15 122.372L1139.34 120.31L1138.34 120.219L1138.53 118.156L1139.53 118.247L1139.71 116.185L1138.72 116.094L1138.91 114.031L1139.9 114.122L1140 113.091L1140.09 112H1137.99V113H1135.96V112H1133.93V113H1131.9V112H1129.88V113H1127.85V112H1125.82V113H1123.79V112H1121.76V113H1119.74V112H1117.71V113H1115.68V112H1113.65V113H1111.62V112H1109.6V113H1107.57V112H1105.54V113H1103.51V112H1101.59L1101.5 112.909L1101.42 113.892L1102.41 113.981L1102.23 115.945L1101.24 115.855L1101.06 117.82L1102.05 117.91L1101.88 119.875L1100.88 119.784L1100.7 121.749L1101.7 121.839L1101.52 123.804L1100.52 123.713L1100.34 125.678L1101.34 125.768L1101.16 127.731L1100.17 127.642L1099.99 129.605L1100.98 129.695L1100.8 131.66L1099.81 131.57L1099.63 133.534L1100.62 133.625L1100.45 135.589L1099.45 135.499L1099.27 137.463L1100.27 137.554L1100.09 139.518L1100 139.509V139.5H1099.89L1099.09 139.428L1099.09 139.5H1099.05V139.864L1099 140.409L1099.05 140.413V140.5H1097.16V139.5H1095.27V140.5H1093.38V139.5H1091.48V140.5H1089.59V139.5H1087.7V140.5H1085.8V139.5H1083.91V140.5H1082.02V139.5H1080.12V140.5H1078.23V139.5H1076.34V140.5H1074.5L1074.53 139.581L1074.45 139.577V139.5H1073.54L1073.6 137.636L1073.6 137.637L1074.6 137.672L1074.67 135.763L1073.67 135.728L1073.67 135.727L1073.74 133.818L1074.74 133.854L1074.81 131.944L1073.81 131.909L1073.88 130L1074.87 130.036L1074.94 128.127L1073.94 128.091L1073.94 128.09L1074.01 126.181L1074.01 126.182L1075.01 126.218L1075.08 124.309L1074.08 124.272L1074.15 122.363L1075.15 122.399L1075.21 120.49L1074.22 120.454L1074.28 118.545L1074.28 118.546L1075.28 118.581L1075.35 116.672L1074.35 116.637L1074.35 116.636L1074.42 114.727L1074.42 114.728L1075.42 114.763L1075.49 112.854L1074.49 112.818L1074.56 110.909L1075.56 110.944L1075.62 109.036L1074.62 109L1074.69 107.09L1074.69 107.091L1075.69 107.127L1075.76 105.218L1074.76 105.182L1074.76 105.181L1074.83 103.272L1075.83 103.309L1075.9 101.399L1074.9 101.363L1074.97 99.4541L1075 99.4551V99.5H1076.13V98.5H1078.41V99.5H1080.68V98.5H1082.95V99.5H1085.22V98.5H1087.49V99.5H1089.38V98.5H1090.91V99.5H1092.44V98.5H1093.97V99.5H1094.7L1095.69 99.5264L1095.71 98.5264V98.5254L1097.68 98.5781V98.5791L1097.65 99.5781L1099.62 99.6309L1099.65 98.6318V98.6309L1101.62 98.6836V98.6846L1101.59 99.6836L1103.56 99.7363L1103.58 98.7373V98.7363L1105.55 98.7891L1105.52 99.7891L1107.49 99.8418L1107.52 98.8418L1109.49 98.8945L1109.46 99.8945L1111.43 99.9473L1111.45 98.9473L1113.42 98.999V99L1113.4 100L1115.36 100.053L1115.39 99.0527V99.0518L1117.36 99.1045V99.1055L1117.33 100.104L1119.3 100.157L1119.33 99.1582V99.1572L1121.29 99.21V99.2109L1121.27 100.21L1123.23 100.263L1123.26 99.2627L1125.23 99.3154L1125.2 100.315L1127.17 100.368L1127.19 99.3682L1129.16 99.4209L1129.14 100.421L1131.1 100.474L1131.13 99.4736L1133.1 99.5254V99.5264L1133.07 100.526L1135.04 100.578L1135.07 99.5791V99.5781L1137.03 99.6309V99.6318L1137.01 100.631L1138.97 100.684L1139 99.6846V99.6836L1140.97 99.7363V99.7373L1140.94 100.736L1142.91 100.789L1142.94 99.7891L1144.9 99.8418L1144.88 100.842L1146.85 100.895L1146.87 99.8945L1148.84 99.9473L1148.81 100.947L1150.78 101L1150.81 100Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>
<Path id="Rectangle 117" d="M868.983 487.5V488.5H870V490.438H869V492.398H870V494.357H869V496.316H870V498.275H869V500.234H870V502.194H869V504.153H870V506.112H869V507.959H870V509.694H869V511.429H870V513.163H869V514.898H870V516.5H869.024V516.633H869V517.5H867.073V516.5H865.121V517.5H863.17V516.5H861.219V517.5H859.267V516.5H857.315V517.5H855.364V516.5H853.412V517.5H851.461V516.5H849.51V517.5H847.559V516.5H845.606V517.5H843.655V516.5H841.704V517.5H839.752V516.5H837.801V517.5H835.85V516.5H833.831V517.5H831.745V516.5H829.659V517.5H827.573V516.5H825.487V517.5H823.401V516.5H821.315V517.5H819.229V516.5H817.144V517.5H815.058V516.5H812.973V517.5H810.887V516.5H808.801V517.5H806.715V516.5H804.629V517.5H802.543V516.5H802.42L802.418 516.479L802.172 516.5H801.5V516.556L801.422 516.562L801.266 514.688L802.262 514.604L802.105 512.729L801.109 512.812L800.953 510.938L801.949 510.854L801.793 508.979L800.797 509.062L800.641 507.188L801.637 507.104L801.48 505.229L800.484 505.312L800.328 503.438L801.324 503.354L801.168 501.479L800.172 501.562L800.016 499.688L801.012 499.604L800.855 497.729L799.859 497.812L799.703 495.938L800.699 495.854L800.543 493.979L799.547 494.062L799.391 492.188L800.387 492.104L800.23 490.229L799.234 490.312L799.083 488.5H799.996V488.36L800.074 488.354L800.003 487.5H801.989V488.5H803.982V487.5H805.976V488.5H807.969V487.5H809.961V488.5H811.954V487.5H813.947V488.5H815.94V487.5H817.934V488.5H819.927V487.5H821.919V488.5H823.912V487.5H825.905V488.5H827.898V487.5H829.892V488.5H831.884V487.5H833.877V488.5H835.816V487.5H837.702V488.5H839.588V487.5H841.473V488.5H843.358V487.5H845.244V488.5H847.13V487.5H849.016V488.5H850.9V487.5H852.786V488.5H854.746V487.5H856.78V488.5H858.813V487.5H860.848V488.5H862.882V487.5H864.915V488.5H866.949V487.5H868.983Z" stroke="#999999" strokeWidth="2" strokeDasharray="2 2"/>

<G id="stair">
<Path id="Polygon 18" d="M1812.5 418V450H1746.5V418H1812.5Z" stroke="black"/>
<Path id="Polygon 19" d="M1773.06 435.4L1777.27 435.453L1777.32 431.561L1781.76 431.617L1781.81 427.61L1786.35 427.668L1786.18 440.627L1773 440.459L1773.06 435.4Z" fill="black"/>
</G>
<G id="driveway">
<Path id="Polygon 25" d="M1396.68 250.113L1402.54 248.31L1405.01 242H1415.61L1417.18 248.31L1426.2 250.113L1428 255.972H1396L1396.68 250.113Z" fill="black"/>
<Circle id="Ellipse 27" cx="1402.54" cy="255.296" r="3.33099" fill="white" stroke="black"/>
<Circle id="Ellipse 28" cx="1421.46" cy="255.296" r="3.33099" fill="white" stroke="black"/>
<Path id="Polygon 26" d="M1452.5 330.902L1452.46 330.812L1444.96 312.312L1444.94 312.247L1444.89 312.192L1432.39 296.192L1432.36 296.145L1432.31 296.106L1418.31 285.106L1418.21 285.033L1400.6 281.51L1400.55 281.5H1378.9L1378.81 281.536L1356.24 290.565L1356.18 290.616L1338.18 305.616L1338.13 305.657L1338.09 305.709L1325.59 323.209L1325.56 323.25L1325.54 323.295L1315.5 345.665V282.268L1331.76 271.428L1350.73 260.944L1372.21 250.953L1373.12 250.529L1372.23 250.059L1346.79 236.587L1328.87 220.663L1315.5 201.84V140.038L1327.04 168.189L1327.05 168.219L1327.06 168.246L1333.56 179.746L1333.58 179.778L1333.61 179.809L1342.61 191.309L1342.64 191.352L1342.68 191.386L1351.18 198.386L1351.2 198.404L1351.23 198.419L1361.23 204.919L1361.25 204.938L1361.29 204.951L1371.79 209.951L1371.83 209.971L1382.87 212.982L1382.9 212.992L1382.94 212.997L1408.61 215.993L1431.33 221.473L1453.24 232.431L1469.68 243.89L1482.14 255.347L1493.09 268.292L1504.05 286.718L1511.01 305.623L1514.5 327.541V342.991L1452.5 342.008V330.902Z" stroke="black"/>
</G>
<G id="stair_2">
<Path id="Polygon 12" d="M1018.5 487V551H968.5V487H1018.5Z" stroke="black"/>
<Path id="Polygon 13" d="M984.038 520.472L989.244 520.476L989.257 516.483L994.761 516.487L994.775 512.376L1000.38 512.381L1000.34 525.677L984.021 525.663L984.038 520.472Z" fill="black"/>
</G>
<G id="stair_3">
<Path id="Polygon 14" d="M1035.5 230V298.5H970.5V230H1035.5Z" stroke="black"/>
<Path id="Polygon 15" d="M990.598 263.535L997.003 263.617L997.079 257.687L1003.85 257.773L1003.93 251.668L1010.83 251.756L1010.58 271.5L990.5 271.244L990.598 263.535Z" fill="black"/>
</G>
<G id="stair_4">
<Path id="Polygon 17" d="M744.079 60.1447L749.212 60.2103L749.273 55.4578L754.7 55.5271L754.762 50.6348L760.293 50.7055L760.091 66.5273L744 66.3219L744.079 60.1447Z" fill="black"/>
<Path id="Polygon 16" d="M778.475 37.9492L776.028 82.4746L729.5 80.0254V33.0518L778.475 37.9492Z" stroke="black"/>
</G>
<G id="stair_5">
<Path id="Polygon 27" d="M598.921 394.58L535.92 403.932L526.566 341.411L588.09 331.075L598.921 394.58Z" stroke="black"/>
<Path id="Polygon 28" d="M550.082 368.34L557.735 368.42L557.798 362.339L565.89 362.423L565.955 356.163L574.202 356.248L573.993 376.492L550 376.244L550.082 368.34Z" fill="black"/>
</G>
<G id="driveway_2">
<Path id="Polygon 27_2" d="M356.871 119.985L379.283 128.452L400.689 140.897L418.113 158.82L432.047 178.228L440.014 203.124L443.996 226.019L442.007 245.905L437.52 262.359L432.208 278.777L380.641 251.274L384.96 241.197L384.987 241.134L384.996 241.064L386.505 229.497L386.495 229.43L384.495 215.43L384.486 215.365L384.461 215.306L380.461 205.806L380.444 205.768L380.423 205.733L374.423 196.233L374.393 196.186L367.328 189.121L367.3 189.1L359.3 183.1L359.247 183.061L359.186 183.036L349.186 179.036L349.141 179.018L349.094 179.009L338.594 177.009L338.547 177H327.933L316.868 180.018L316.801 180.036L316.741 180.072L261.646 213.327L228.705 165.146L296.188 122.473L330.51 116.006L356.871 119.985Z" stroke="black"/>
<Path id="Polygon 25_2" d="M353.176 158.613L359.035 156.81L361.514 150.5H372.106L373.683 156.81L382.697 158.613L384.5 164.472H352.5L353.176 158.613Z" fill="black"/>
<Circle id="Ellipse 27_2" cx="359.035" cy="163.796" r="3.33099" fill="white" stroke="black"/>
<Circle id="Ellipse 28_2" cx="377.965" cy="163.796" r="3.33099" fill="white" stroke="black"/>
<Circle id="Ellipse 218" cx="334.5" cy="229.5" r="49.5" stroke="black"/>
</G>
</G>

      {/* Path lines (drawn first, so start points are on top) */}
      {Array.isArray(path) && path.length > 1 && (
        path.map((nodeId, idx) => {
          if (idx === path.length - 1) return null;
          return (
            <PathLine
              key={`pathline-${nodeId}-${path[idx + 1]}`}
              from={String(nodeId)}
              to={String(path[idx + 1])}
              nodes={nodes}
              isLastNode={idx === path.length - 2}
            />
          );
        })
      )}

      {/* Start Points (tappable, drawn after lines) */}
      {predefinedStartPoints.map((pt) => (
        <RenderStartPoint
          key={pt.id}
          id={pt.id}
          cx={pt.cx}
          cy={pt.cy}
          isSelected={String(startNodeId) === String(pt.id)}
        />
      ))}
      {/* Custom start point indicator if not a predefined start point */}
      {customStartCoords && (
        <RenderStartPoint
          id={startNodeId}
          cx={customStartCoords.cx}
          cy={customStartCoords.cy}
          isSelected={true}
        />
      )}
    </Svg>
  );
};

export default MapSVG;


