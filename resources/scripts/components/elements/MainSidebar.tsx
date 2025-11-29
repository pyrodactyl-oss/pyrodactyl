import styled from 'styled-components';

const MainSidebar = styled.nav`
    width: 300px;
    /* display: flex;  REMOVE THIS */
    flex-direction: column;
    flex-shrink: 0;
    border-radius: 8px;
    overflow-x: hidden;
    padding: 32px;
    margin-right: 8px;
    user-select: none;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);

    & > .pyro-subnav-routes-wrapper {
        display: flex;
        flex-direction: column;
        font-size: 14px;
        flex: 1 1 auto;
        min-height: 0;

        & > a,
        & > div {
            display: flex;
            position: relative;
            padding: 16px 0;
            gap: 8px;
            font-weight: 600;
            min-height: 56px;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            transition: 200ms all ease-in-out;

            &.active {
                color: #fa4e49;
                fill: #fa4e49;
            }
        }

        & > .pyro-subnav-spacer {
            flex: 1 1 auto;
        }
    }
`;

export default MainSidebar;
