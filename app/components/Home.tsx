/* eslint-disable no-console */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-async-promise-executor */
/* eslint-disable prettier/prettier */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { Grid, Row, Col } from 'react-flexbox-grid';
import { Button } from '@blueprintjs/core';
import routes from '../constants/routes.json';
import styles from './Home.css';


export default function Home(): JSX.Element {
  const [signalingServerPort, setSignalingServerPort] = useState('0000');
  const { t } = useTranslation();
  // const { t, i18n } = useTranslation();

  // Example of how to get signaling server port from main process in renderer process
  // following this practice, you can also get local server ip address
  useEffect(() => {
    ipcRenderer.on('sending-port-from-main', (_, message) => {
      // ipcRenderer.on('sending-port-from-main', (event, message) => {
      setSignalingServerPort(`${message}`);
    });
    ipcRenderer.invoke('get-signaling-server-port');
  }, []);

  const onButtonClick = () => {
    console.log(t('Language'));
  };

  return (
    <Grid fluid>
      <Row middle="xs" center="xs" style={{ height: '100vh' }}>
        <Col xs={12} md={6}>
          <div className={styles.container} data-tid="container">
            <h2 className="bp3-heading">Home</h2>
            <br />
            <Link id="to-counter" to={routes.COUNTER}>
              {' '}
              <Button text="to Counter" />
            </Link>
            <br />
            <h3 className="bp3-heading">
              {`${t(
                'Signaling server is running on port'
              )}: ${signalingServerPort}`}
            </h3>
            <br />
            <h3 className="bp3-heading">{`Locales test ${t('Language')}`}</h3>
            <br />
            <Button type="button" onClick={onButtonClick}>
              CLICK ME!
            </Button>
          </div>
        </Col>
      </Row>
    </Grid>
  );
}
