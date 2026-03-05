import moment from "moment"

const processDate = (data) => {
    const format = moment(data).format("DD/MM/YYYY/LTS")
    const splitData = format.split("/")
    const time = moment(splitData[3], ["h:mm:ss A"]).format("HH:mm:ss")
    const date = `${splitData[2]}-${splitData[1]}-${splitData[0]}`
    return [date, time]
}

export { processDate }