// @flow
import {ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import populateEvents from './Packer';
import React from 'react';
import moment from 'moment';
import _ from 'lodash';

const LEFT_MARGIN = 60 - 1;
// const RIGHT_MARGIN = 10
const CALENDER_HEIGHT = 2400;
// const EVENT_TITLE_HEIGHT = 15
const TEXT_LINE_HEIGHT = 17;
// const MIN_EVENT_TITLE_WIDTH = 20
// const EVENT_PADDING_LEFT = 4

function range(from, to) {
    return Array.from(Array(to), (_, i) => from + i);
}

export default class DayView extends React.PureComponent {
    constructor(props) {
        super(props);
        this.calendarHeight = (props.end - props.start) * 100;
        const width = props.width - LEFT_MARGIN;
        const sizeTopEvents = props.sizeTopEvents ? props.sizeTopEvents : 2;
        const heightTopEvents = props.heightTopEvents ? props.heightTopEvents : 26;
        const packedEvents = populateEvents(props.events, width, props.start);
        let initPosition =
            _.min(_.map(packedEvents, 'top')) -
            this.calendarHeight / (props.end - props.start);
        initPosition = initPosition < 0 ? 0 : initPosition;
        let topHeight = heightTopEvents * sizeTopEvents;
        let fullTopHeight = heightTopEvents * props.allDayEvents.length;
        if (sizeTopEvents > props.allDayEvents.length) {
            topHeight = heightTopEvents * props.allDayEvents.length;
        }

        this.state = {
            _scrollY: initPosition,
            packedEvents,
            heightTopEvents,
            sizeTopEvents,
            showMoreTopEvents: false,
            topHeight,
            fullTopHeight,
        };
    }
    componentWillReceiveProps(nextProps) {
        const width = nextProps.width - LEFT_MARGIN;
        this.setState({
            packedEvents: populateEvents(nextProps.events, width, nextProps.start),
        });
    }

    componentDidMount() {
        this.props.scrollToFirst && this.scrollToFirst();
    }

    scrollToFirst() {
        setTimeout(() => {
            if (this.state && this.state._scrollY && this._scrollView) {
                this._scrollView.scrollTo({
                    x: 0,
                    y: this.state._scrollY,
                    animated: true,
                });
            }
        }, 1);
    }

    _renderRedLine() {
        const offset = 100;
        const {format24h} = this.props;
        const {width, styles} = this.props;
        const timeNowHour = moment().hour();
        const timeNowMin = moment().minutes();
        return (
            <View
                key={`timeNow`}
                style={[
                    styles.lineNow,
                    {
                        top:
                            offset * (timeNowHour - this.props.start) +
                            (offset * timeNowMin) / 60,
                        width: width - 20,
                    },
                ]}
            />
        );
    }

    _renderLines() {
        const {format24h, start, end} = this.props;
        const offset = this.calendarHeight / (end - start);
        return range(start, end + 1).map((i, index) => {
            let timeText;
            if (i === start) {
                timeText = ``;
            } else if (i < 12) {
                timeText = !format24h ? `${i} AM` : i;
            } else if (i === 12) {
                timeText = !format24h ? `${i} PM` : i;
            } else if (i === 24) {
                timeText = !format24h ? `12 AM` : 0;
            } else {
                timeText = !format24h ? `${i - 12} PM` : i;
            }
            const {width, styles} = this.props;
            return [
                <Text
                    key={`timeLabel${i}`}
                    style={[styles.timeLabel, {top: offset * index - 6}]}
                >
                    {timeText}
                </Text>,
                i === start ? null : (
                    <View
                        key={`line${i}`}
                        style={[styles.line, {top: offset * index, width: width - 20}]}
                    />
                ),
                <View
                    key={`lineHalf${i}`}
                    style={[
                        styles.line,
                        {top: offset * (index + 0.5), width: width - 20},
                    ]}
                />,
            ];
        });
    }

    _renderTimeLabels() {
        const {styles, start, end} = this.props;
        const offset = this.calendarHeight / (end - start);
        return range(start, end).map((item, i) => {
            return (
                <View key={`line${i}`} style={[styles.line, {top: offset * i}]}/>
            );
        });
    }

    _onEventTapped(event) {
        this.props.eventTapped(event);
    }

    _renderEvents() {
        const {styles} = this.props;
        const {packedEvents} = this.state;
        let events = packedEvents.map((event, i) => {
            const style = {
                left: event.left,
                height: event.height,
                width: event.width,
                top: event.top,
            };

            const eventColor = {
                backgroundColor: event.color,
            };

            // Fixing the number of lines for the event title makes this calculation easier.
            // However it would make sense to overflow the title to a new line if needed
            const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
            const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A';
            return (
                <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={() =>
                        this._onEventTapped(this.props.events[event.index])
                    }
                    key={i} style={[styles.event, style, event.color && eventColor]}
                >
                    {this.props.renderEvent ? (
                        this.props.renderEvent(event)
                    ) : (
                        <View>
                            <Text numberOfLines={1} style={styles.eventTitle}>
                                {event.title || 'Event'}
                            </Text>
                            {numberOfLines > 1 ? (
                                <Text
                                    numberOfLines={numberOfLines - 1}
                                    style={[styles.eventSummary]}
                                >
                                    {event.summary || ' '}
                                </Text>
                            ) : null}
                            {numberOfLines > 2 ? (
                                <Text style={styles.eventTimes} numberOfLines={1}>
                                    {moment(event.start).format(formatTime)} -{' '}
                                    {moment(event.end).format(formatTime)}
                                </Text>
                            ) : null}
                        </View>
                    )}
                </TouchableOpacity>
            );
        });

        return (
            <View style={{flex: 1}}>
                <View style={{marginLeft: LEFT_MARGIN}}>{events}</View>
            </View>
        );
    }

    _renderAllDayEvents() {
        const {styles} = this.props;
        let allTopEvents = this.props.allDayEvents;
        if (!this.state.showMoreTopEvents) {
            allTopEvents = allTopEvents.slice(0, this.state.sizeTopEvents);
        }
        let events = allTopEvents.map((event, i) => {
            let style = {
                width: this.props.width - 10,
            };
            if (this.props.allDayEvents.length > this.state.sizeTopEvents) {
                style = {
                    width: this.props.width - 50,
                };
            }
            const eventColor = {
                backgroundColor: event.color,
            };

            // Fixing the number of lines for the event title makes this calculation easier.
            // However it would make sense to overflow the title to a new line if needed
            const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
            const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A';
            return (
                <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={() =>
                        this._onEventTapped(this.props.events[event.index])
                    }
                    key={i} style={[styles.allDayEvent, style, event.color && eventColor]}
                >
                    {this.props.renderAllDayEvent ? (
                        this.props.renderAllDayEvent(event)
                    ) : (
                        <View>
                            <Text numberOfLines={1} style={styles.eventTitle}>
                                {moment(event.start).format("DDTMM hh:mm")} {moment(event.end).format("DDTMM hh:mm")}{event.title || 'Event'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        });
        const showMoreIcon = this.props.showMoreIcon ? (
            this.props.showMoreIcon
        ) : (
            <Image source={require('./showmore.png')} style={styles.arrow}/>
        );
        const showLessIcon = this.props.showLessIcon ? (
            this.props.showLessIcon
        ) : (
            <Image source={require('./showless.png')} style={styles.arrow}/>
        );

        return (
            <View>
                {this.props.allDayEvents.length > this.state.sizeTopEvents ? (
                    <View style={{
                        alignContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                    }}><View>{events}</View>
                        {this.state.showMoreTopEvents ? (<TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() => this.setState({showMoreTopEvents: false})}
                        >
                            {showLessIcon}
                        </TouchableOpacity>) : (
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => this.setState({showMoreTopEvents: true})}
                            >
                                {showMoreIcon}
                            </TouchableOpacity>
                        )}

                    </View>
                ) : (<View style={{
                    alignContent: "center",
                    alignItems: "center",
                }}>{events}</View>)}
            </View>
        );
    }

    render() {
        const {styles} = this.props;
        return (
            <View style={{flex: 1}}>
                {this.props.isLoading && <ActivityIndicator size="small" color="grey"/>}
                {this.props.allDayEvents.length > 0 &&
                <View style={{
                    height: this.state.showMoreTopEvents ? this.state.fullTopHeight : this.state.topHeight,
                    marginTop: 2,
                    padding: 2
                }}>
                    {this._renderAllDayEvents()}
                </View>}
                <ScrollView
                    ref={ref => (this._scrollView = ref)}
                    contentContainerStyle={[
                        styles.contentStyle,
                        {width: this.props.width},
                    ]}
                >
                    {this._renderLines()}
                    {this._renderEvents()}
                    {this._renderRedLine()}
                </ScrollView>
                {this.props.renderBottomMenu && <View style={{
                    bottom: this.props.bottomMenuBottom ? this.props.bottomMenuBottom : 120,
                    height: this.props.bottomMenuHeight ? this.props.bottomMenuHeight : 200,
                    width: this.props.width,
                    backgroundColor: "#F5F5F6",
                    alignContent: "center",
                    alignItems: "center",
                    padding: 10,
                }}>{this.props.renderBottomMenu}</View>}

            </View>
        );
    }

}
