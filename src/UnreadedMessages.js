import React, { Component } from 'react';
import styled from 'styled-components';

import clubs from './clubs';
import { getRanking } from './api';
import { Storage } from './utils';

const Context = React.createContext();
export const FEED_VERSION_KEY = 'feedVersions';

export class UnreadedMessagesProvider extends Component {
  storage = Storage();
  state = {
    unreadedMessages: {},
  };

  componentDidMount() {
    this.refreshUnreadedMessages();
  }

  refreshUnreadedMessages = async () => {
    await this.getUnreadedMessages();
    setTimeout(this.refreshUnreadedMessages, 5000);
  };

  getUnreadedMessages = async () => {
    const latestVersions = JSON.parse(this.storage.getItem(FEED_VERSION_KEY) || '{}');
    let unreaded;
    try {
      const { items } = await getRanking([
        {
          algorithm: 'cryptoverse_club_feed_new_count',
          params: {
            versions: latestVersions,
          },
        },
      ]);
      unreaded = items.reduce((acc, item) => ({ ...acc, [item.club_id]: item.count }), {});
    } catch (e) {
      unreaded = {};
    }

    const unreadedMessages = clubs.reduce((acc, club) => {
      const asset = `${club.network}:${club.address}`;
      return {
        ...acc,
        [club.address]: latestVersions[asset] ? unreaded[asset] || 0 : null,
      };
    }, {});

    this.setState({ unreadedMessages });
  };

  render() {
    return <Context.Provider value={this.state.unreadedMessages}>{this.props.children}</Context.Provider>;
  }
}

export const UnreadedCount = ({ token, showUndiscovered, className, style }) => (
  <Context.Consumer>
    {(undreadedMessages) => {
      const count = undreadedMessages[token.address];

      if (count === undefined || count === 0 || (count === null && !showUndiscovered)) {
        return null;
      }

      return (
        <UnreadedCountContainer
          className={className}
          style={style}
          primaryColor={token.primaryColor}
          secondaryColor={token.secondaryColor}
        >
          {count === null ? 'Undiscovered' : count > 100 ? '99+' : `${count} New`}
        </UnreadedCountContainer>
      );
    }}
  </Context.Consumer>
);

export const UnreadedCountContainer = styled.div`
  margin-left: auto;
  align-self: center;
  border-radius: 6px;
  padding: 2px 5px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ primaryColor }) => primaryColor}
  background: ${({ secondaryColor }) => secondaryColor}
`;