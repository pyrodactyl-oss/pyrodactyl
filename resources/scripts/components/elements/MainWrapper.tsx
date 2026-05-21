import styled from 'styled-components';

/**
 * Outer wrapper for every page's main content area (right of the
 * sidebar). The `min-width: 0` + `overflow-x: hidden` combo is load-
 * bearing in flex contexts: without min-width:0, this element's
 * `width: 100%` becomes a FLEX BASIS rather than a hard ceiling, so
 * if a descendant has a wide intrinsic min-content size (long mod
 * titles, button rows that don't shrink, etc.) the wrapper refuses
 * to shrink below that intrinsic size and ends up wider than the
 * available column. Visible symptom: content on the right edge
 * (Upload buttons, Refresh buttons, etc.) gets clipped by the
 * parent's overflow-hidden as the layout extends past the viewport.
 * Pinning `min-width: 0` lets flexbox actually shrink this slot to
 * fit, and `overflow-x: hidden` corrals any descendant that still
 * tries to grow.
 */
const MainWrapper = styled.div`
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow-x: hidden;
    border-radius: 0.375rem;
    background: radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%);
`;

export default MainWrapper;
